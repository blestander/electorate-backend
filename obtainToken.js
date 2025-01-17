const superagent = require("superagent");
const moment = require("moment");

const { setSession, buildJWT } = require('./utility.js');

const DISCORD_OBTAIN_TOKEN_URL = "https://discord.com/api/oauth2/token";
const DISCORD_OBTAIN_ID_URL = "https://discord.com/api/v6/users/@me";

const DISCORD_SCOPE = encodeURI("identify guild");
const DISCORD_REDIRECT_URI = "http://angular.local:4200/auth";

exports.obtainToken = (request, response) => {
    if (!("code" in request.body && "remember" in request.body)) {
        response.status(400).send({error: "no_code"})
        return;
    }
    superagent.post(DISCORD_OBTAIN_TOKEN_URL)
        .send(`client_id=${process.env.CLIENT_ID}`)
        .send(`client_secret=${process.env.CLIENT_SECRET}`)
        .send(`scope=${DISCORD_SCOPE}`)
        .send(`redirect_uri=${request.get('Origin')}/auth`)
        .send("grant_type=authorization_code")
        .send(`code=${request.body.code}`)
        .then((dis_response) => {
            superagent.get(DISCORD_OBTAIN_ID_URL)
                .set('Authorization', `Bearer ${dis_response.body.access_token}`)
                .then(buildAndSendToken(response, dis_response, request.body.remember));
        }).catch(error => {
            if (error.response.body.error == "invalid_request")
                response.status(400).send({error: "invalid_code"})
            else
                response.status(error.status).send(error.response.body)
        });
};

function buildAndSendToken(response, dis_response, remember) {
    return (id_response) => {
        token = buildJWT(
            dis_response.body.access_token,
            dis_response.body.refresh_token,
            moment().add(dis_response.body.expires_in, 'seconds').format(),
            dis_response.body.scope.split(" "),
            id_response.body.id
        )
        setSession(
            response, 
            token, 
            remember ? new Date(Date.now() + 5184000000) : undefined);
        response.status(200).send('')
    }
}