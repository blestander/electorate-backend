const { ensureLogin } = require('./utility.js');

exports.finishPoll = ensureLogin(finishPollInternal);

function finishPollInternal(request, response, token) {
    response.status(200).send({});
}