const { ensureLogin } = require('./utility.js');
const { db } = require('./db.js');
const { generateIRVResults } = require('./irv.js');
const { generateSmithIRVResults } = require('./smith.js');
const { generateSchulzeResults } = require('./schulze.js');
const { handleWebhook } = require('./webhook.js');

exports.finishPoll = ensureLogin(finishPollInternal);

function finishPollInternal(request, response, token) {
    let poll_id = request.params.id;
    let user_id = token.id;
    let docRef = db.collection("polls").doc(poll_id);
    docRef.get()
        .then(processPollAndRequestBallots(response, user_id, docRef))
        .catch(err => response.status(500).send('Server error'));
}

function processPollAndRequestBallots(response, user_id, pollRef) {
    return snapshot => {
        if (snapshot.exists) { // This poll in fact exists
            let poll = snapshot.data();
            if (poll.owner == user_id) // If this user owns the poll, proceed
                if (!poll.finished) { // Poll is still open
                    pollRef.collection("ballots").get()
                        .then(processBallotsAndSaveResults(response, pollRef, poll.method, poll.options, poll.name, poll.webhook))
                        .catch(err => {
                            console.log(err);
                            response.status(500).send('Server error');
                        });
                } else
                    response.status(409).send("finished");
            else
                response.status(403).send('Not owner');
        } else // No such poll exists
            response.status(404).send("no_such_poll");
    }
}

function processBallotsAndSaveResults(response, pollRef, method, options, name, webhook) {
    return snapshot => {
        if (snapshot.size > 0) { // Someone has voted
            let results = generateResults(method, options, snapshot);
            let changes = {
                finished: true,
                results: results
            };
            pollRef.set(changes, {merge: true})
                .then(() => {
                    response.status(200).send(changes);
                    if (webhook)
                        handleWebhook(webhook, name, method, options, results);
                }).catch(err => response.status(500).send('Server error'));
        } else // Nobody has voted
            response.status(409).send("no_votes");
    }
}

function generateResults(method, options, ballots) {
    switch (method) {
        case "fptp": // First Past the Post
            return generateFPTPResults(options, ballots);
        case "irv": // Instant Runoff Voting
            return generateIRVResults(options, ballots);
        case "approval": // Approval Voting
            return generateApprovalResults(options, ballots);
        case "smithirv": // Smith/IRV
            return generateSmithIRVResults(options, ballots);
        case "cav": // Combined Approval Voting
            return generateCAVResults(options, ballots);
        case "mbc": // Modified Borda Count
            return generateMBCResults(options, ballots);
        case "schulze": // Schulze method
            return generateSchulzeResults(options, ballots);
        case "score5": // Score voting, 0-5
            return generateScoreResults(options, ballots);
    }
}

function generateFPTPResults(options, ballots) {
    counts = {};

    options.forEach(option => counts[option] = 0);

    ballots.forEach(doc => {
        let ballot = doc.data();
        counts[ballot.choice]++;
    });
    
    return counts;
}

function generateApprovalResults(options, ballots) {
    counts = {};

    options.forEach(option => counts[option] = 0);

    ballots.forEach(doc => {
        let ballot = doc.data();
        let choice = ballot.choice;
        
        options.forEach(option => {
            if (choice.includes(option))
                counts[option]++;
        });
    });

    return counts;
}

function generateCAVResults(options, ballots) {
    let scores = {};

    options.forEach(option => scores[option] = 0);

    ballots.forEach(doc => {
        let choice = doc.data().choice;

        options.forEach(option => scores[option] += choice[option])
    });

    return scores;
}

function generateMBCResults(options, ballots) {
    let scores = {};
    options.forEach(option => scores[option] = 0);

    ballots.forEach(doc => {
        let ballot = doc.data().choice;

        for (let i = 0; i < ballot.length; i++)
            scores[ballot[i]] = ballot.length - i;
    });

    return scores;
}

function generateScoreResults(options, ballots) {
    let scores = {};
    options.forEach(option => scores[option] = 0);

    ballots.forEach(doc => {
        let ballot = doc.data().choice;
        console.log(ballot);

        for (const option of Object.keys(ballot))
            scores[option] += ballot[option];
    });

    return scores;
}