const { obtainToken } = require('./obtainToken.js')
const { getPoll } = require('./getPoll.js')

exports.helloHTTP = (request, response) => {
    response.send("Hello, world!")
};

exports.obtainToken = obtainToken;
exports.getPoll = getPoll;

