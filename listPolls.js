const { ensureLogin } = require('./utility.js');
const { db } = require('./db.js');

exports.listPolls = ensureLogin((request, response, token) => {
    db.collection('polls').where('owner', '==', token.id).get()
        .then(processAndReturnPolls(request, response, token))
        .catch(err => response.status(500).send('Server error'));
});

function processAndReturnPolls(request, response, token) {
    return snapshot => {
        let results = []
        snapshot.forEach(doc => {
            let data = doc.data();
            let poll = {
                name: data.name,
                description: data.description,
                finished: data.finished,
                id: doc.id
            }
            results.push(poll);
        });
        response.status(200).send(results);
    }
}