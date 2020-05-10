const superagent = require("superagent");
const moment = require("moment")
const { JWT, JWK } = require("jose");

const DISCORD_OBTAIN_TOKEN_URL = "https://discordapp.com/api/oauth2/token"
const DISCORD_SCOPE = encodeURI("identify guild")
const DISCORD_REDIRECT_URI = "http://localhost:4200/auth"

exports.helloHTTP = (request, response) => {
    response.send("Hello, world!")
};

exports.obtainToken = handleCORS((request, response) => {
    if (!("code" in request.body)) {
        response.status(400).send({error: "no_code"})
        return;
    }
    superagent.post(DISCORD_OBTAIN_TOKEN_URL)
        .send(`client_id=${process.env.CLIENT_ID}`)
        .send(`client_secret=${process.env.CLIENT_SECRET}`)
        .send(`scope=${DISCORD_SCOPE}`)
        .send(`redirect_uri=${DISCORD_REDIRECT_URI}`)
        .send("grant_type=authorization_code")
        .send(`code=${request.body.code}`)
        .then((dis_response) => {
            response.status(200).send({
                token: buildJWT(
                    dis_response.body.access_token,
                    dis_response.body.refresh_token,
                    moment().add(dis_response.body.expires_in, 'seconds').format(),
                    dis_response.body.scope.split(" ")
                )
            })
        }).catch(error => {
            if (error.response.body.error == "invalid_request")
                response.status(400).send({error: "invalid_code"})
            else
                response.status(error.status).send(error.response.body)
        });
}, ["POST"]);

function handleCORS(func, methods) {
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
}

function buildJWT(access_token, refresh_token, expires_on, scope) {
    return JWT.sign({
        access: access_token,
        refresh: refresh_token,
        expires_on: expires_on,
        scope, scope
    }, JWK.asKey(process.env.TOKEN_KEY))
}