const { ensureLogin } = require('./utility.js');
const { db } = require('./db.js');

exports.createPoll = ensureLogin(createPollInternal);

function createPollInternal(request, response, token) {
    let poll = {
        ...request.body,
        owner: token.id,
        finished: false,
        start_time: new Date(Date.now())
    }
    db.collection('polls').add(poll)
        .then(snapshot => {
            response.status(201)
                .set('Location', `/poll/${snapshot.id}`)
                .send(poll);
        })
}