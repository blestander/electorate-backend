const { handleCORS, validateJWT, decodeJWT } = require("./utility.js");
const { db } = require('./db.js')

exports.castVote = handleCORS((request, response) => {
    if ("token" in request.body && "id" in request.body && "choice" in request.body) { // Nothing missing
        if (validateJWT(request.body.token)) { // Token is valid
            let token = decodeJWT(request.body.token);
            let user_id = token.id;
            let poll_id = request.body.id;
            let choice = request.body.choice;
            let docRef = db.collection('polls').doc(poll_id);
            docRef.get()
                .then(checkPollAndRequestBallot(response, user_id, choice, docRef))
                .catch(err => response.status(500).send('Server error'))
        } else // Token is invalid
            response.status(403).send('Forbidden');
    } else // Something missing
        response.status(400).send('Bad request');
}, ["POST"]);

function checkPollAndRequestBallot(response, user_id, choice, docRef) {
    return doc => {
        if (doc.exists) { // Poll exists
            let docdata = doc.data();
            if (docdata.finished) // Poll is concluded
                response.status(409).send({
                    error: "finished"
                });
            else if (!docdata.options.includes(choice))
                response.status(409).send({
                    error: "invalid choice"
                });
            else {
                let ballotsRef = docRef.collection('ballots');
                ballotsRef.where('voter', '==', user_id)
                    .get().then(checkBallotAndCreateBallot(response, user_id, choice, docRef))
                    .catch(err => response.status(500).send('Server error'));
            }
        } else // Poll does not exist
            response.status(404).send('Not found');
    };
}

function checkBallotAndCreateBallot(response, user_id, choice, ballotRef) {
    return ballot => {
        if (ballot.size) // Vote already cast
            response.status(409).send({
                error: "already voted"
            });
        else
            response.status(200).send({choice: choice});
    }
}