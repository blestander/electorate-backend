const { ensureLogin } = require('./utility.js');
const { db } = require('./db.js');

exports.deletePoll = ensureLogin((request, response, token) => {
    response.status(204).end();
});;