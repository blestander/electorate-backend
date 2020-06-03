const superagent = require('superagent');

exports.handleWebhook = (webhook, name, method, id, results) => {
    try {
        let resultString = generateWebhookOutput(method, results);
        let output = [
            `**The poll \"${name}\" has concluded**`,
            `Poll URL: https://electorate.blestander.com/poll/${id}`,
            '',
            '**__Results__**',
            `${resultString}`,
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
        case "score5":
            return generateSimpleOutput(results);
        case "cav":
            return generateCAVOutput(results);
        case "irv":
            return generateIRVOutput(results);
        case "smithirv":
            return generateSmithIRVOutput(results);
        case "schulze":
            return generateScorelessSimpleOutput(results.final);
        case "mbc":
            return generateScorelessSimpleOutput(results);
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

function generateIRVOutput(results) {
    // Build lines for finalists
    let lines = [];
    let initialGroupings = generatePositiveGroupings(results[results.length - 1]);
    for (let i = 1; i <= initialGroupings.length; i++)
        lines.push(
            generateLine(results[results.length - 1], initialGroupings, i, initialGroupings.length - i)
        );

    // Build lines for those eliminated at each stage
    for (let i = results.length - 2, j = initialGroupings.length + 1; i >= 0; i--, j++) {
        let lastSet = Object.keys(results[i + 1]);
        let thisSet = Object.keys(results[i]);
        let omitted = thisSet.filter(x => !lastSet.includes(x));
        lines.push(
            `${j}: ${omitted.join(', ')} - ${results[i][omitted[0]]}`
        );
    }

    return lines.join('\n');
}

function generateSmithIRVOutput(results) {
    return [
        `Dominating set: ${results.smith.set.join(', ')}`,
        '__Results Within Dominating Set__',
        generateIRVOutput(results.irv)
    ].join('\n');
}

function generateScorelessSimpleOutput(results) {
    // Eliminate empty space in groupings array
    let prunedGroupings = generatePositiveGroupings(results);

    // Build up lines of output
    let lines = [];
    for (let i = 1; i <= prunedGroupings.length; i++)
        lines.push(
            generateLineWithoutScore(prunedGroupings, i, prunedGroupings.length - i)
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

function generateLineWithoutScore(array, rank, index) {
    return `${rank}: ${array[index].join(', ')}`
}