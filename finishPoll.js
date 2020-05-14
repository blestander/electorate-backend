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
                    pollRef.collection("ballot").get()
                        .then(processBallotsAndSaveResults(request, response, pollRef, poll.method))
                        .catch(err => response.status(500).send('Server error'));
                } else
                    response.status(409).send("finished");
            else
                response.status(403).send('Not owner');
        } else // No such poll exists
            response.status(404).send("no_such_poll");
    }
}

function processBallotsAndSaveResults(request, response, pollRef, method) {
    return snapshot => {
        if (snapshot.size > 0) { // Someone has voted
            response.status(200).send({});
        } else // Nobody has voted
            response.status(409).send("no_votes");
    }
}