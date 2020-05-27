const { setSession } = require('./utility.js');

exports.logout = (request, response) => {
    setSession(response, "", new Date(Date.now() - 86400000))
    response.status(204).end();
};