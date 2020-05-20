const { ensureLogin } = require('./utility.js');

exports.checkLogin = ensureLogin((request, response, token) => {
    response.status(204).end();
});