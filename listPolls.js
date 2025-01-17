const { ensureLogin, formatDate } = require('./utility.js');
const { db } = require('./db.js');

exports.listPolls = ensureLogin((request, response, token) => {
    db.collection('polls')
        .where('owner', '==', token.id)
        .orderBy('start_time', 'desc')
        .get()
        .then(processAndReturnPolls(request, response, token))
        .catch(err => {
            response.status(500).send('Server error')
            console.log(err);
        });
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
                id: doc.id,
                start_time: formatDate(data.start_time),
                finish_time: formatDate(data.finish_time),
            }
            results.push(poll);
        });
        response.status(200).send(results);
    }
}