exports.generateIRVResults = (options, ballotDocs) => {
    // Retrieve all ballots
    let ballots = [];
    ballotDocs.forEach(doc => {
        ballots.push(doc.data().choice);
    });
    return irv(options, ballots);
}

function irv(options, ballots) {
    // Setup
    let total = ballots.length;
    let results = [];
    let votes = {}
    options.forEach(option => {
        votes[option] = [];
    });

    // Assigned all ballots to their initial vote
    ballots.forEach(ballot => {
        votes[ballot[0]].push(ballot);
    });
    
    // Count up votes for each option
    let counts = generateCounts(votes);
    results.push(counts);

    // Determine if winner
    if (hasWinner(counts, total))
        return results;

    // Clear zeroes
    let dropped = false;
    let dropped_options = []
    options.forEach(option => {
        if (votes[option].length == 0) {
            dropped_options.push(option);
            delete votes[option];
            dropped = true;
        }
    });
    if (dropped) {
        counts = generateCounts(votes);
        results.push(counts);
    }

    // Drop lowest until winner
    do {
        // Calculate the bottom
        let lowest = Number.MAX_SAFE_INTEGER;
        let lowest_options = [];
        for (const option in counts)
            if (counts[option] < lowest) {
                lowest = counts[option];
                lowest_options = [option];
            } else if (counts[option] == lowest)
                lowest_options.push(option);

        // Gather votes to be reorganized and drop the bottom
        let reorganizedVotes = [];
        lowest_options.forEach(option => {
            reorganizedVotes = reorganizedVotes.concat(votes[option]);
            delete votes[option];
        });
        dropped_options = dropped_options.concat(lowest_options);
        dropped_options.forEach(option => {
            reorganizedVotes.forEach(vote => {
                let index = vote.indexOf(option)
                if (index >= 0)
                    vote.splice(index, 1);
            });
        });

        // Reassign reorganized votes
        reorganizedVotes.forEach(vote => {
            if (vote.length >= 1)
                votes[vote[0]].push(vote);
            else
                total--;
        });
        
        // Generate new counts and add to results
        counts = generateCounts(votes);
        results.push(counts);
    } while (!hasWinner(counts, total));
    return results;
}
exports.irv = irv;

function generateCounts(votes) {
    let counts = {};
    for (const option in votes) {
        counts[option] = votes[option].length;
    }
    return counts;
}

function hasWinner(counts, total) {
    // Check for actual winner
    let winCondition = calculateWinCondition(total);
    for (const option in counts) {
        if (counts[option] >= winCondition)
            return true;
    }

    // Check for ties
    let tie = null;
    for (const option in counts) {
        if (tie == null)
            tie = counts[option];
        else if (counts[option] != tie)
            return false;
    }
    return true;
}

function calculateWinCondition(total) {
    let result = Math.ceil(total / 2);
    if (total % 2 == 0)
        result++;
    return result;
}