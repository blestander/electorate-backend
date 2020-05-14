const { ensureLogin } = require('./utility.js');
const { db } = require('./db.js');

exports.finishPoll = ensureLogin(finishPollInternal);

function finishPollInternal(request, response, token) {
    if ("id" in request.body) { // Everything present in request
        let poll_id = request.body.id;
        let user_id = token.id;
        let docRef = db.collection("polls").doc(poll_id);
        docRef.get()
            .then(processPollAndRequestBallots(request, response, user_id, docRef))
            .catch(err => response.status(500).send('Server error'));
    } else // Incomplete request
        response.status(400).send('Bad request');
}

function processPollAndRequestBallots(request, response, user_id, pollRef) {
    return snapshot => {
        if (snapshot.exists) { // This poll in fact exists
            let poll = snapshot.data();
            if (poll.owner == user_id) // If this user owns the poll, proceed
                if (!poll.finished) { // Poll is still open
                    pollRef.collection("ballots").get()
                        .then(processBallotsAndSaveResults(request, response, pollRef, poll.method, poll.options))
                        .catch(err => response.status(500).send('Server error'));
                } else
                    response.status(409).send("finished");
            else
                response.status(403).send('Not owner');
        } else // No such poll exists
            response.status(404).send("no_such_poll");
    }
}

function processBallotsAndSaveResults(request, response, pollRef, method, options) {
    return snapshot => {
        if (snapshot.size > 0) { // Someone has voted
            let results = generateResults(method, options, snapshot);
            let changes = {
                finished: true,
                results: results
            };
            pollRef.set(changes, {merge: true}).then(() => response.status(200).send(changes))
                .catch(err => response.status(500).send('Server error'));
        } else // Nobody has voted
            response.status(409).send("no_votes");
    }
}

function generateResults(method, options, ballots) {
    switch (method) {
        case "fptp": // First Past the Post
            return generateFPTPResults(options, ballots);
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