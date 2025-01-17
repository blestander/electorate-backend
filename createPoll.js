const { ensureLogin, verifyGuildProof } = require('./utility.js');
const { db } = require('./db.js');

const webhookRegex = /https:\/\/discordapp\.com\/api\/webhooks\/([0-9]*)\/([A-Za-z0-9\-_]*)/;

exports.createPoll = ensureLogin(createPollInternal);

function createPollInternal(request, response, token) {
    if (validateSubmission(request.body, token.id)) { // Requested poll checks out
        let poll = {
            ...request.body,
            owner: token.id,
            finished: false,
            start_time: new Date(Date.now())
        }
        db.collection('polls').add(poll)
            .then(snapshot => {
                response.status(201)
                    .set('Location', `/poll/${snapshot.id}`)
                    .send(poll);
            })
    } else // Something didn't check out
        response.status(400).send('Bad Request');
}

function validateSubmission(poll, user_id) {
    if ("name" in poll && typeof(poll.name) == 'string' && poll.name.length > 0)
        if ("options" in poll && Array.isArray(poll.options) && poll.options.length > 0) {
            let allOptionsValid = true;
            poll.options.forEach(option => {
                if (typeof(option) != 'string')
                    allOptionsValid = false;
            });
            if (allOptionsValid)
                if (validateMethod(poll.method))
                    if (validateWebhook(poll.webhook))
                        if (validateGuild(poll.guild, poll.guild_proof, user_id))
                            return true;
        }
    return false;
}

function validateMethod(method) {
    return ['fptp', 'irv', 'smithirv', 'approval', 'cav', 'schulze', 'mbc', 'score5'].includes(method);
}

function validateWebhook(webhook) {
    if (webhook)
        return webhookRegex.test(webhook);
    else
        return true;
}

function validateGuild(guild_id, guild_proof, user_id) {
    if (this.guild_id) {
        return verifyGuildProof(user_id, guild_id, guild_proof);
    } else
        return true;
}