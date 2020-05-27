const { ensureLogin, formatDate } = require('./utility.js');
const { db } = require('./db.js');

exports.getHistory = ensureLogin((request, response, token) => {
    db.collectionGroup('ballots').where('voter', '==', token.id).get()
        .then(processBallotsAndStartPollRequests(response))
        .catch(err => console.error(err))
});

function processBallotsAndStartPollRequests(response) {
    return snapshot => {
        if (snapshot.size == 0) // Nothing was voted on
            response.status(200).send([])
        else { // Something was voted on
            let refs = [];
            let times = [];
            snapshot.forEach(doc => {
                refs.push(doc.ref.parent.parent);
                times.push(formatDate(doc.data().vote_time));
            })
            let ref = refs.pop();
            ref.get().then(processPoll(
                response,
                refs.slice(),
                times,
                []
            ))
        }
    }
}

function processPoll(response, refs, times, polls) {
    return snapshot => {
        let doc = snapshot.data();
        polls.push({
            name: doc.name,
            description: doc.description,
            finished: doc.finished,
            id: snapshot.id,
            vote_time: times.pop()
        });
        if (refs.length > 0) {
            let ref = refs.pop();
            ref.get().then(processPoll(
                response,
                refs.slice(),
                times.slice(),
                polls
            )).catch(err => {
                console.error(err);
                response.status(500).send('Server error');
            });
        } else
            response.status(200).send(polls);
    };
}