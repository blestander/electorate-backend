const { ensureLogin } = require('./utility.js');
const { db } = require('./db.js');

exports.getVoters = ensureLogin((request, response, token) => {
    let user_id = token.id;
    let poll_id = request.params.id;

    db.collection('polls').doc(poll_id).get()
        .then(processPollAndRequestBallots(response, user_id, poll_id))
        .catch(err => {
            console.error(err);
            response.status(500).send('Server error')
        });
});

function processPollAndRequestBallots(response, user_id, poll_id) {
    return snapshot => {
        if (snapshot.exists) { // Poll exists
            let poll = snapshot.data();
            if (user_id == poll.owner) // Requester owns the poll
                db.collection('polls').doc(poll_id).collection('ballots').get()
                    .then(processBallotsAndRespond(response))
                    .catch(err => {
                        console.error(err);
                        response.status(500).send('Server error');
                    });
            else // Requester does not own the poll
                response.status(403).send('Forbidden');
        } else // Poll does not exist
            response.status(404).send('Not found')
    };
}

function processBallotsAndRespond(response) {
    return snapshot => {
        let voters = [];
        
        snapshot.forEach(doc => {
            let ballot = doc.data();
            voters.push({
                name: ballot.name,
                custom_image: ballot.custom_image,
                default_image: ballot.default_image
            });
        })

        response.status(200).send(voters);
    };
}