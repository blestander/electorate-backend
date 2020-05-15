const { ensureLogin } = require('./utility.js');
const { db } = require('./db.js');

exports.createPoll = ensureLogin(createPollInternal);

function createPollInternal(request, response, token) {
    let poll = {
        ...request.body,
        owner: token.id
    }
    db.collection('polls').add(poll)
        .then(snapshot => {
            response.status(200).send({id: snapshot.id});
        })
}