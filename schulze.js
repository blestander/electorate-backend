const { ensureLogin } = require('./utility.js');
const { db } = require('./db.js');

exports.generateSchulzeResults = (options, ballots) => {
    try {
        // Generate head to head value
        let headToHeads = processBallots(options, ballots);

        // Calculate strongest paths
        let paths = calculatePaths(options, headToHeads);

        // Determine better candidates for ranking
        let ranking = calculateRanking(options, paths);

        return {
            raw: headToHeads,
            paths: paths,
            final: ranking
        };
    } catch (e) {
        console.error(e);
        throw e;
    }
};

function buildEmptyMatrix(options) {
    let results = {};
    options.forEach(option => {
        results[option] = {};
        options.forEach(option2 => {
            if (option != option2)
                results[option][option2] = 0;
        });
    });
    return results;
}

function processBallots(options, ballots) {
    // Build empty matrix
    let results = buildEmptyMatrix(options);

    // For each ballot...
    ballots.forEach(doc => {
        let ballot = doc.data().choice;

        // Determine which options were omitted
        let omitted = options.filter(x => !ballot.includes(x));

        // For each option on the ballot...
        for (let i = 0; i < ballot.length; i++) {
            // For each option after this option on the ballot...
            for (let j = i + 1; j < ballot.length; j++) {
                // Mark this as a victory for option i over option j
                results[ballot[i]][ballot[j]] += 1;
            }
            // Do the same for the omitted options
            omitted.forEach(option => results[ballot[i]][option] += 1);
        }
    });

    return results;
}

// Variant of Floyd-Marshall algorithm
// Based on pseudocode at https://en.wikipedia.org/wiki/Schulze_method#Implementation
function calculatePaths(options, d) {
    // Build Empty Matrix
    let p = buildEmptyMatrix(options);

    // Determine obvious paths
    options.forEach(i => {
        options.forEach(j => {
            if (i != j)
                if (d[i][j] > d[j][i])
                    p[i][j] = d[i][j];
                else
                    p[i][j] = 0;
        });
    });

    // Find stronger paths through other options
    options.forEach(i => {
        options.forEach(j => {
            if (i != j)
                options.forEach(k => {
                    if (i != k && j != k)
                        p[j][k] = Math.max(
                            p[j][k],
                            Math.min(p[j][i], p[i][k])
                        );
                });
        });
    });

    return p;
}

function calculateRanking(options, paths) {
    // Build empty score objects
    let scores = {};
    options.forEach(option => scores[option] = 0);

    // For each option...
    options.forEach(i => {
        // For each other option...
        options.forEach(j => {
            if (i != j)
                // If the first option is a stronger candidate than the second...
                if (paths[i][j] > paths[j][i])
                    // Score 1 point to the first option
                    scores[i] += 1;
        });
    });

    return scores;
}