const { ensureLogin } = require('./utility.js');
const { db } = require('./db.js');

exports.getHistory = ensureLogin((request, response, token) => {
    response.status(204).end();
});