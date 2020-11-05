const { ensureLogin, formatDate, createGuildProof, tryRestoreArray } = require('./utility.js')
const { db } = require('./db.js');
const superagent = require('superagent');


exports.getPoll = ensureLogin(getPollInternal);

function getPollInternal(request, response, token) {
    let poll_id = request.params.id;
    if (poll_id) { // Poll ID was provided
        let user_id = token.id;
        let docRef = db.collection("polls").doc(poll_id);
        docRef.get()
            .then(processPollAndRequestBallotOrGuilds(response, token.access, docRef, poll_id, user_id))
            .catch(err => {
                console.error(err);
                response.status(500).send("Server error");
            });
    } else // No poll ID
        response.status(400).send('Bad request')
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
                start_time: formatDate(data.start_time),
                finish_time: formatDate(data.finish_time)
            };
            if (poll.own)
                poll.webhook = data.webhook;
            if (data.guild)
                superagent.get("https://discord.com/api/v6/users/@me/guilds")
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
                poll.guild_proof = createGuildProof(user_id, guild_id);
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
            docs.forEach(doc => {
                let choice = doc.data().choice;
                if (Array.isArray(choice))
                    choice = choice.map(x => tryRestoreArray(x))
                poll.choice = choice;
            });

        response.status(200).send(poll);
    }
}

