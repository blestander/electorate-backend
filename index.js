const superagent = require("superagent");
const moment = require("moment")

const DISCORD_OBTAIN_TOKEN_URL = "https://discordapp.com/api/oauth2/token"
const DISCORD_SCOPE = encodeURI("identify guild")
const DISCORD_REDIRECT_URI = "http://localhost:4200/auth"

exports.helloHTTP = (request, response) => {
    response.send("Hello, world!")
};

exports.obtainToken = (request, response) => {
    if (handleCORS(request, response, ["POST"])) {
        superagent.post(DISCORD_OBTAIN_TOKEN_URL)
            .send(`client_id=${process.env.CLIENT_ID}`)
            .send(`client_secret=${process.env.CLIENT_SECRET}`)
            .send(`scope=${DISCORD_SCOPE}`)
            .send(`redirect_uri=${DISCORD_REDIRECT_URI}`)
            .send("grant_type=authorization_code")
            .send(`code=${request.body.code}`)
            .then((dis_response) => {
                response.status(200).send({
                    access_token: dis_response.body.access_token,
                    refresh_token: dis_response.body.refresh_token,
                    expires_on: moment().add(dis_response.body.expires_in, 'seconds').format(),
                    scope: dis_response.body.scope
                })
            });
    }
}

function handleCORS(request, response, methods) {
    response.set('Access-Control-Allow-Origin', '*')

    if (request.method === "OPTIONS") {
        response.set('Access-Control-Allow-Methods', methods.join(','))
        response.set('Access-Control-Allow-Headers', 'Content-Type')
        response.status(204).send('')
        return false;
    } else if (!(methods.includes(request.method))) {
        response.status(405).send('')
        return false;
    } else
        return true;
}