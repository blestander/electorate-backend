const { obtainToken } = require('./obtainToken.js');
const { getPoll } = require('./getPoll.js');
const { castVote } = require('./castVote.js');

exports.helloHTTP = (request, response) => {
    response.send("Hello, world!")
};

exports.obtainToken = obtainToken;
exports.getPoll = getPoll;
exports.castVote = castVote;

