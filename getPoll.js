const { handleCORS, ensureLogin, validateJWT, decodeJWT } = require('./utility.js')
const { db } = require('./db.js');
const superagent = require('superagent');


exports.getPoll = ensureLogin(getPollInternal);

function getPollInternal(request, response, token) {
    let poll_id = request.params.id;
    let user_id = token.id;
    let docRef = db.collection("polls").doc(poll_id);
    docRef.get()
        .then(processPollAndRequestBallotOrGuilds(response, token.access, docRef, poll_id, user_id))
        .catch(err => {
            response.status(500).send("Server error");
        });
}

function processPollAndRequestBallotOrGuilds(response, access_token, docRef, poll_id, user_id) {
    return doc => {
        if (doc.exists) {
            data = doc.data();
            poll = {
                id: poll_id,
                name: data.name,
                description: data.description,
                options: data.options,
                method: data.method,
                own: data.owner == user_id,
                finished: data.finished,
                results: data.results,
                start_time: data.start_time,
            };
            if (data.guild)
                superagent.get("https://discordapp.com/api/v6/users/@me/guilds")
                    .set('Authorization', `Bearer ${access_token}`)
                    .then(processGuildsAndRequestBallot(response, docRef, user_id, poll, data.guild))
                    .catch(err => {
                        console.error(err);
                        response.status(500).send('Server error');
                    });
            else
                docRef.collection("ballots").where("voter", "==", user_id).get()
                    .then(processBallotAndRespond(response, poll))
                    .catch(err => {
                        response.status(500).send('Server error');
                    });
        }
        else
            response.status(404).send('Not found')
    };
}

function processGuildsAndRequestBallot(response, docRef, user_id, poll, guild_id) {
    return dis_response => {
        let guilds = dis_response.body;
        for (let i = 0; i < guilds.length; i++)
            if (guilds[i].id == guild_id) {
                docRef.collection("ballots").where("voter", "==", user_id).get()
                    .then(processBallotAndRespond(response, poll))
                    .catch(err => {
                        response.status(500).send('Server error');
                    });
                return;
            }
        // We're not in this guild
        response.status(403).send('Forbidden');
    };
}

function processBallotAndRespond(response, poll) {
    return docs => {
        poll.has_voted = (docs.size != 0);
        poll.can_vote = !poll.has_voted && !poll.finished;

        if (poll.has_voted)
            docs.forEach(doc => poll.choice = doc.data().choice);

        response.status(200).send(poll);
    }
}

