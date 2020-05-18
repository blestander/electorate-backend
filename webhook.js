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
    }
}

function generateSimpleOutput(results) {
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
    let prunedGroupings = rawGroupings.filter(x => Array.isArray(x));

    // Build up lines of output
    let lines = [];
    for (let i = 1; i <= prunedGroupings.length; i++)
        lines.push(
            `${i}: ${prunedGroupings[prunedGroupings.length - i].join(', ')}`
        );

    return lines.join('\n');
}