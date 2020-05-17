const { irv } = require('./irv.js');

exports.generateSmithIRVResults = (options, ballotDocs) => {
    // Retrieve ballots
    let ballots = [];
    ballotDocs.forEach(doc => {
        ballots.push(doc.data().choice);
    });

    // Calculate Smith set
    let smith = generateSmithSet(options, ballots);

    // Prune ballots for IRV
    let irvBallots = ballots.map(ballot => {
        return ballot.filter(choice => smith.set.includes(choice));
    }).filter(ballot => ballot.length > 0);

    // Calculate IRV results
    irvResults = irv(options, irvBallots);

    return {
        smith: smith,
        irv: irvResults
    };
};

function generateSmithSet(options, ballots) {
    // Build head to head array
    let headtoheads = {}
    options.forEach(option => {
        headtoheads[option] = {};
    });

    // Calculate head to heads
    for (let i = 0; i < options.length; i++)
        for (let j = i + 1; j < options.length; j++) {
            let iWins = 0;
            let jWins = 0;
            // Calculate for each ballot if i or j wins
            ballots.forEach(ballot => {
                let iIndex = ballot.indexOf(options[i]);
                let jIndex = ballot.indexOf(options[j]);
                if (iIndex == jIndex == -1) // Both omitted; ignore
                    ;
                else if (iIndex == -1) // j wins by default
                    jWins++;
                else if (jIndex == -1) // i wins by default
                    iWins++;
                else if (iIndex < jIndex) // i wins properly
                    iWins++;
                else // j wins properly
                    jWins++;
            });
            headtoheads[options[i]][options[j]] = iWins / (iWins + jWins);
            headtoheads[options[j]][options[i]] = jWins / (iWins + jWins);
        }

    // Attempt to find Smith set of increasing size
    for (let size = 1; size <= options.length; size++) {
        let result = findSmithSet(
            options,
            headtoheads,
            size,
            [],
            0
        );
        if (result != null)
            return {
                table: headtoheads,
                set: result
            };
    }

    console.error('REACH END OF generateSmithSet(); SHOULD NOT BE POSSIBLE!');
}

function findSmithSet(options, headtoheads, size, set, start) {
    for (let i = start; i < options.length; i++) {
        let newSet = set.slice();
        newSet.push(options[i]);
        if (newSet.length == size) { // newSet is full set
            if (checkSmithSet(options, headtoheads, newSet))
                return newSet;
        } else { // newSet is partial set
            let result = findSmithSet(
                options,
                headtoheads,
                size,
                newSet,
                i + 1
            );
            if (result != null)
                return result;
        }
    }
    return null;
}

function checkSmithSet(options, headtoheads, set) {
    for (let i = 0; i < options.length; i++)
        if (!set.includes(options[i]))
            for (let j = 0; j < set.length; j++)
                if (headtoheads[set[j]][options[i]] <= 0.5)
                    return false;
    return true;
}