const Firestore = require("@google-cloud/firestore");

const { handleCORS, validateJWT, decodeJWT } = require('./utility.js')

const db = new Firestore({
    projectId: "electorate-274912",
    keyFilename: "credentials.json"
});

exports.getPoll = handleCORS((request, response) => {
    if ("token" in request.query && "id" in request.query) { // Nothing missing from request
        let token = request.query.token;
        if (validateJWT(token)) {
            let poll_id = request.query.id;
            let user_id = decodeJWT(token).id;
            let docRef = db.collection("polls").doc(poll_id);
            docRef.get()
                .then(processPollAndRequestBallot(response, docRef, poll_id, user_id))
                .catch(err => {
                    response.status(500).send("Server error");
                })
        } else
            response.status(403).send("Forbidden");
    } else 
        response.status(400).send("Bad request");
}, ["GET"]);

function processPollAndRequestBallot(response, docRef, poll_id, user_id) {
    return doc => {
        if (doc.exists) {
            data = doc.data();
            poll = {
                id: poll_id,
                name: data.name,
                description: data.description,
                options: data.options,
                method: data.method,
            };
            docRef.collection("ballots").where("voter", "==", user_id).get()
                .then(processBallotAndRespond(response, poll))
                .catch(err => {
                    response.status(500).send("Server error");
                })
        }
        else
            response.status(404).send('Not found')
    };
}

function processBallotAndRespond(response, poll) {
    return doc => {
        poll.has_voted = doc.exists;
        poll.can_vote = !poll.has_voted;

        if (poll.has_voted)
            poll.choice = doc.data().choice;

        response.status(200).send(poll);
    }
}

