const { JWT, JWK } = require("jose");

exports.handleCORS = (func, methods) => {
    return function(request, response) {
        response.set('Access-Control-Allow-Origin', 'http://angular.local:4200')
        response.set('Cache-Control', 'private')
        response.set('Access-Control-Allow-Credentials', true)

        if (request.method === "OPTIONS") {
            response.set('Access-Control-Allow-Methods', methods.join(','))
            response.set('Access-Control-Allow-Headers', 'Content-Type')
            response.status(204).send('')
            return false;
        } else if (!(methods.includes(request.method))) {
            response.status(405).send('')
        } else
            func(request, response);
    }
};

exports.ensureLogin = func => {
    return function(request, response) {
        if (request.cookies.__session) {
            if (validateJWT(request.cookies.__session)) // If the token is valid
                func(request, response, decodeJWT(request.cookies.__session));
            else { // Invalid token
                response.cookie( // Wipe cookie
                    "__session",
                    "",
                    {
                        maxAge: 1,
                        secure: process.env.PROD === "true",
                        sameSite: process.env.PROD === "true" ? "Lax" : "None",
                        httpOnly: true
                    }
                );
                response.status(401).send("not_logged_in");
            }
        } else 
            response.status(401).send('Not logged in');
    }
}

exports.buildJWT = (access_token, refresh_token, expires_on, scope, id) => {
    return JWT.sign({
        access: access_token,
        refresh: refresh_token,
        expires_on: expires_on,
        scope: scope,
        id: id,
    }, JWK.asKey(process.env.TOKEN_KEY), {
        iat: false // Because the server is literally too fast
    });
};

function validateJWT(token) {
    try {
        return JWT.verify(token, JWK.asKey(process.env.TOKEN_KEY))
            && new Date(JWT.decode(token).expires_on) > Date.now();
    } catch (e) {
        console.log(e);
        return false;
    }
};
exports.validateJWT = validateJWT;

function decodeJWT(token) {
    return JWT.decode(token);
}
exports.decodeJWT = decodeJWT;