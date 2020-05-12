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
        } else // Token is invalid
            response.status(403).send('Forbidden');
    } else // Something missing
        response.status(400).send('Bad request');
}, ["POST"]);

function checkPollAndRequestBallot(response, user_id, choice, docRef) {
    return doc => {
        response.status(200).send({
            id: user_id,
            choice: choice
        });
    };
}