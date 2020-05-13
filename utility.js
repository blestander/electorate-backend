const { JWT, JWK } = require("jose");

exports.handleCORS = (func, methods) => {
    return function(request, response) {
        response.set('Access-Control-Allow-Origin', '*')

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
        try {
            if (validateJWT(request.cookies.electorate-token)) // If the token is valid
                func(request, response, decodeJWT(request.cookies.electorate-token));
            else // Invalid token
                response.cookie( // Wipe cookie
                    "electorate-token",
                    "",
                    {
                        maxAge: 1
                    }
                );
                response.status(403).send("not_logged_in");
        } catch (e) { // No token cookie exists
            response.status(403).send("not_logged_in");
        }
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

exports.validateJWT = (token) => {
    try {
        return JWT.verify(token, JWK.asKey(process.env.TOKEN_KEY))
            && new Date(JWT.decode(token).expires_on) > Date.now();
    } catch (e) {
        console.log(e);
        return false;
    }
};

exports.decodeJWT = (token) => {
    return JWT.decode(token);
}