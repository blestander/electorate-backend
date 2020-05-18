const superagent = require('superagent');

exports.handleWebhook = (webhook, name, method, options, results) => {
    try {
        let resultString = generateWebhookOutput(method, results);
        let output = [
            `**The poll \"${name}\" has concluded**`,
            '',
            '**__Results__**',
            `${resultString}`
        ].join('\n');

        superagent.post(webhook)
            .send({
                content: output,
                username: "Electorate",
            })
            .then(
                value => {},
                error => console.error(error)
            );
    } catch (e) {
        console.error(e);
    }
};

function generateWebhookOutput(method, results) {
    switch (method) {
        case "fptp":
        case "approval":
            return generateSimpleOutput(results);
        case "cav":
            return generateCAVOutput(results);
    }
}

function generateSimpleOutput(results) {
    // Eliminate empty space in groupings array
    let prunedGroupings = generatePositiveGroupings(results);

    // Build up lines of output
    let lines = [];
    for (let i = 1; i <= prunedGroupings.length; i++)
        lines.push(
            generateLine(results, prunedGroupings, i, prunedGroupings.length - i)
        );

    return lines.join('\n');
}

function generateCAVOutput(results) {
    let positiveGroupings = generatePositiveGroupings(results);

    // Generate negative groupings
    let antiResults = {};
    for (const option in results)
        antiResults[option] = -results[option];
    let negativeGroupings = generatePositiveGroupings(antiResults);

    // Build positive lines
    let lines = []
    for (let i = 1; i <= positiveGroupings.length; i++)
        lines.push(
            generateLine(results, positiveGroupings, i, positiveGroupings.length - i)
        );

    // Build negative lines
    let isZero = Object.values(results).includes(0);
    for (let i = isZero ? 1 : 0, j = positiveGroupings.length + 1; i < negativeGroupings.length; i++, j++)
        lines.push(
            generateLine(results, negativeGroupings, j, i)
        );

    return lines.join('\n');
}

function generatePositiveGroupings(results) {
    let maxVotes = Object.values(results).reduce((previous, current) => Math.max(previous, current), 0);
    let rawGroupings = new Array(maxVotes + 1);

    // Group options by poll numbers
    for (const option in results) {
        let count = results[option];
        if (rawGroupings[count])
            rawGroupings[count].push(option);
        else
            rawGroupings[count] = [ option ];
    }

    // Eliminate empty space in groupings array
    return rawGroupings.filter(x => Array.isArray(x));
}

function generateLine(results, array, rank, index) {
    return `${rank}: ${array[index].join(', ')} - ${results[array[index][0]]}`;
}