const { ensureLogin, decodeJWT } = require("./utility.js");
const { db } = require('./db.js')

exports.castVote = ensureLogin((request, response, token) => {
    if ("id" in request.body && "choice" in request.body) { // Nothing missing
        let user_id = token.id;
        let poll_id = request.body.id;
        let choice = request.body.choice;
        let docRef = db.collection('polls').doc(poll_id);
        docRef.get()
            .then(checkPollAndRequestBallot(response, user_id, choice, docRef))
            .catch(err => response.status(500).send('Server error'))
    } else // Something missing
        response.status(400).send('Bad request');
});

function checkPollAndRequestBallot(response, user_id, choice, docRef) {
    return doc => {
        if (doc.exists) { // Poll exists
            let docdata = doc.data();
            if (docdata.finished) // Poll is concluded
                response.status(409).send({
                    error: "finished"
                });
            else if (typeof(choice) == "string" && !docdata.options.includes(choice))
                response.status(409).send({
                    error: "invalid choice"
                });
            else {
                let ballotsRef = docRef.collection('ballots');
                ballotsRef.where('voter', '==', user_id)
                    .get().then(checkBallotAndCreateBallot(response, user_id, choice, ballotsRef))
                    .catch(err => response.status(500).send('Server error'));
            }
        } else // Poll does not exist
            response.status(404).send('Not found');
    };
}

function checkBallotAndCreateBallot(response, user_id, choice, ballotsRef) {
    return ballot => {
        if (ballot.size) // Vote already cast
            response.status(409).send({
                error: "already voted"
            });
        else
            ballotsRef.add({
                voter: user_id,
                choice: choice
            }).then(concludeCastVote(response, choice));
    }
}

function concludeCastVote(response, choice) {
    return snapshot => {
        response.status(200).send({
            choice: choice,
            can_vote: false,
            has_voted: true,
        });
    };
}