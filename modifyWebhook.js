const { ensureLogin } = require('./utility.js');
const { db } = require('./db.js');

const webhookRegex = /https:\/\/discordapp\.com\/api\/webhooks\/([0-9]*)\/([A-Za-z0-9\-_]*)/;

exports.setWebhook = ensureLogin((request, response, token) => {
    let newHook = request.body.webhook
    let poll_id = request.params.id;
    let user_id = token.id;
    let pollRef = db.collection('polls').doc(poll_id);
    if (webhookRegex.test(newHook)) // Webhook valid
        pollRef.get().then(processPollAndSetWebhook(response, user_id, pollRef, newHook))
            .catch(err => {
                console.error(err);
                response.status(500).send('Server error');
            });
    else // Webhook invalid
        response.status(400).send('Bad webhook URL');
});

function processPollAndSetWebhook(response, user_id, pollRef, newHook) {
    return (snapshot) => {
        if (snapshot.exists) { // This poll exists
            let poll = snapshot.data();
            if (poll.owner == user_id) // Request from owner
                if (!poll.finished) { // Poll still running
                    pollRef.set({webhook: newHook}, {merge: true})
                        .then(() => response.status(200).send({webhook: newHook}))
                        .catch(err => {
                            console.error(err);
                            response.status(500).send('Server error');
                        })
                } else // Poll finished
                    response.status(409).send('Cannot change a webhook after its poll has ended');
            else // Not owner
                response.status(403).send('Forbidden');
        } else // Poll does not exist
            response.status(404).send('Poll not found');
    };
}

exports.deleteWebhook = ensureLogin((request, response, token) => {
    let poll_id = request.params.id;
    let user_id = token.id;
    let pollRef = db.collection('polls').doc(poll_id);
    pollRef.get().then(processPollAndDeleteWebhook(response, user_id, pollRef))
        .catch(err => {
            console.error(err);
            response.status(500).send('Sever error');
        })
});

function processPollAndDeleteWebhook(response, user_id, pollRef) {
    return (snapshot) => {
        if (snapshot.exists) { // This poll exists
            let poll = snapshot.data();
            if (poll.owner == user_id) // Request from owner
                if (!poll.finished) { // Poll still running
                    pollRef.set({webhook: ""}, {merge: true})
                        .then(() => response.status(200).send({webhook: ""}))
                        .catch(err => {
                            console.error(err);
                            response.status(500).send('Server error');
                        });
                } else // Poll is finished
                    response.status(409).send('Cannot change webhook after poll conclusion.');
            else // Not the owner
                response.status(403).send('Forbidden');
        } else // What poll?
            response.status(404).send('Poll not found');
    };
}