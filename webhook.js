exports.handleWebhook = (webhook, method, options, results) => {
    try {
        let output = generateWebhookOutput(method, results);
        console.log(output);
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