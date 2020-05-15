const { ensureLogin } = require('./utility.js');

exports.createPoll = ensureLogin(createPollInternal);

function createPollInternal(request, response, token) {
    response.status(200).send({hello: "world"});
}