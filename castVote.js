const { handleCORS } = require("./utility.js");

exports.castVote = handleCORS((request, response) => {
    response.status(200).send('Hello, world!');
}, ["POST"]);