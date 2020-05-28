const superagent = require('superagent');

const { ensureLogin, createGuildProof } = require('./utility.js');

exports.getGuilds = ensureLogin((request, response, token) => {
    superagent.get("https://discordapp.com/api/v6/users/@me/guilds")
        .set('Authorization', `Bearer ${token.access}`)
        .then(success => {
            let guilds = success.body;
            let results = [];
            guilds.forEach(guild => results.push({
                id: guild.id,
                name: guild.name,
                proof: createGuildProof(token.id, guild.id)
            }));
            response.status(200).send(results);
        }).catch(err => {
            console.error(err);
            response.status(500).send('Server error');
        })
});