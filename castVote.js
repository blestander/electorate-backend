const superagent = require('superagent');

const { ensureLogin, decodeJWT } = require("./utility.js");
const { db } = require('./db.js')

exports.castVote = ensureLogin((request, response, token) => {
    if ("choice" in request.body) { // Nothing missing
        let user_id = token.id;
        let poll_id = request.params.id;
        let choice = request.body.choice;
        let access_token = token.access;
        let docRef = db.collection('polls').doc(poll_id);
        docRef.get()
            .then(checkPollAndRequestBallot(response, user_id, access_token, choice, docRef))
            .catch(err => response.status(500).send('Server error'))
    } else // Something missing
        response.status(400).send('Bad request');
});

function checkPollAndRequestBallot(response, user_id, access_token, choice, docRef) {
    return doc => {
        if (doc.exists) { // Poll exists
            let docdata = doc.data();
            if (docdata.finished) // Poll is concluded
                response.status(409).send({
                    error: "finished"
                });
            else if (typeof(choice) == "string" && !docdata.options.includes(choice))
                response.status(409).send({
                    error: "invalid choice"
                });
            else {
                let ballotsRef = docRef.collection('ballots');
                ballotsRef.where('voter', '==', user_id)
                    .get().then(checkBallotAndRequestUserInformation(response, user_id, access_token, choice, ballotsRef))
                    .catch(err => response.status(500).send('Server error'));
            }
        } else // Poll does not exist
            response.status(404).send('Not found');
    };
}

function checkBallotAndRequestUserInformation(response, user_id, access_token, choice, ballotsRef) {
    return ballot => {
        if (ballot.size) // Vote already cast
            response.status(409).send({
                error: "already voted"
            });
        else
            superagent.get("https://discordapp.com/api/v6/users/@me")
                .set('Authorization', `Bearer ${access_token}`)
                .then(
                    processUserAndCreateBallot(response, user_id, choice, ballotsRef),
                    err => {
                        console.log(err);
                        response.status(500).send('Server error');
                    })
    }
}

function processUserAndCreateBallot(response, user_id, choice, ballotsRef) {
    return dis_response => {
        let body = dis_response.body;
        let name = `${body.username}#${body.discriminator}`;
        let discMod5 = body.discriminator % 5;
        let default_image = `https://cdn.discordapp.com/embed/avatars/${discMod5}.png`;
        let custom_image = undefined;
        if (body.avatar)
            if (body.avatar.startsWith("a_"))
                custom_image = `https://cdn.discordapp.com/avatars/${user_id}/${body.avatar}.gif`;
            else
                custom_image = `https://cdn.discordapp.com/avatars/${user_id}/${body.avatar}.png`;

        ballotsRef.add({
            voter: user_id,
            choice: choice,
            default_image: default_image,
            custom_image: custom_image,
            name: name
        }).then(concludeCastVote(response, choice));
    };
}

function concludeCastVote(response, choice) {
    return snapshot => {
        response.status(200).send({
            choice: choice,
            can_vote: false,
            has_voted: true,
        });
    };
}