const { ensureLogin } = require('./utility.js');
const { db } = require('./db.js');

exports.finishPoll = ensureLogin(finishPollInternal);

function finishPollInternal(request, response, token) {
    if ("id" in request.body) { // Everything present in request
        let poll_id = request.body.id;
        let user_id = token.id;
        let docRef = db.collection("polls").doc(poll_id);
        docRef.get().then(processPollAndRequestBallots(request, response, user_id, docRef));
    } else // Incomplete request
        response.status(400).send('Bad request');
}

function processPollAndRequestBallots(request, response, user_id, docRef) {
    return snapshot => {
        if (snapshot.exists) { // This poll in fact exists
            response.status(200).send('');
        } else // No such poll exists
            response.status(404).send("no_such_poll");
    }
}