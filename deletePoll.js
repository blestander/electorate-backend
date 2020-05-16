const { ensureLogin } = require('./utility.js');
const { db } = require('./db.js');

exports.deletePoll = ensureLogin((request, response, token) => {
    let docRef = db.collection('polls').doc(request.body.id)
    docRef.get()
        .then(validateRequestAndDeletePoll(response, token, docRef))
        .catch(err => response.status(500).send('Server error'));
});

function validateRequestAndDeletePoll(response, token, docRef) {
    return snapshot => {
        if (snapshot.exists) { // Poll exists
            let poll = snapshot.data();
            if (poll.owner == token.id) { // Requester owns poll
                docRef.delete()
                    .then(() => response.status(204).end())
                    .catch(err => response.send(500).send('Server error'));
            } else // Requester doesn't own poll and can't delete it
                response.status(403).send("Cannot delete someone else's poll");
        } else // No such poll
            response.status(404).send('Not found');
    };
}