const { ensureLogin } = require('./utility.js');

exports.listPolls = ensureLogin((request, response, token) => {
    response.status(200).send([
        'Hey',
        'There'
    ]);
});