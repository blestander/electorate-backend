const { ensureLogin } = require('./utility.js');

exports.finishPoll = ensureLogin(finishPollInternal);

function finishPollInternal(request, response, token) {
    if ("id" in request.body) { // Everything present in request
        response.status(200).send({});
    } else // Incomplete request
        response.status(400).send('');
}