const path = require('path');

exports.hostAngular = (request, response) => {
    response.status(200).sendFile(path.join(__dirname, 'static', 'index.html'));
}