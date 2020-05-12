const { handleCORS, validateJWT } = require("./utility.js");

exports.castVote = handleCORS((request, response) => {
    if ("token" in request.body && "id" in request.body && "choice" in request.body) { // Nothing missing
        if (validateJWT(request.body.token)) { // Token is valid
            response.status(200).send({
                id: request.body.id,
                choice: request.body.choice
            });
        } else // Token is invalid
            response.status(403).send('Forbidden');
    } else // Something missing
        response.status(400).send('Bad request');
}, ["POST"]);