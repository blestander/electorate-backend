const superagent = require('superagent');

const { ensureLogin, verifyGuildProof, tryRestoreArray } = require("./utility.js");
const { db } = require('./db.js')

exports.castVote = ensureLogin((request, response, token) => {
    if ("choice" in request.body) { // Nothing missing
        let user_id = token.id;
        let poll_id = request.params.id;
        let choice = request.body.choice;
        let access_token = token.access;
        let guild_proof = request.body.guild_proof;
        let docRef = db.collection('polls').doc(poll_id);
        docRef.get()
            .then(checkPollAndRequestBallot(response, user_id, guild_proof, access_token, choice, docRef))
            .catch(err => {
                console.log(err);
                response.status(500).send('Server error');
            });
    } else // Something missing
        response.status(400).send('Bad request');
});

function checkPollAndRequestBallot(response, user_id, guild_proof, access_token, choice, docRef) {
    return doc => {
        if (doc.exists) { // Poll exists
            let docdata = doc.data();
            if (docdata.finished) // Poll is concluded
                response.status(409).send({
                    error: "finished"
                });
            else if (docdata.guild && !verifyGuildProof(user_id, docdata.guild, guild_proof)) // Check guild membership proof
                response.status(403).send('Forbidden');
            else if (!verifyChoice(docdata.method, docdata.options, choice))
                response.status(400).send('Bad request');
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
            vote_time: new Date(Date.now()),
            default_image: default_image,
            custom_image: custom_image,
            name: name
        }).then(concludeCastVote(response, choice));
    };
}

function concludeCastVote(response, choice) {
    return snapshot => {
        let processedChoices = Array.isArray(choice) ? choice.map(x => tryRestoreArray(x)) : choice;

        response.status(200).send({
            choice: processedChoices,
            can_vote: false,
            has_voted: true,
        });
    };
}

function verifyChoice(method, options, choice) {
    switch (method) {
        case "fptp":
            return typeof(choice) == 'string' && options.includes(choice);
        case "irv":
        case "smithirv":
        case "schulze":
        case "approval":
        case "mbc":
            return choice && Array.isArray(choice) && choice.length > 0 && verifyRankedChoice(options, choice);
        case "cav":
            return choice && verifyScoreChoice(options, choice, -1, 1);
        case "score5":
            return choice && verifyScoreChoice(options, choice, 0, 5);
        default:
            return false;
    }
}

function verifyRankedChoice(options, choice) {
    for (let i = 0; i < choice; i++)
        if (!options.includes(choice[i]))
            return false;
    return true;
}

function verifyScoreChoice(options, choice, min, max) {
    for (const option of Object.keys(choice)) {
        if (!options.includes(option))
            return false;
        if (choice[option] < min || choice[option] > max)
            return false;
    }
    return true;
}