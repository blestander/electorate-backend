const { ensureLogin } = require('./utility.js');
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
            snapshot.forEach(doc => refs.push(doc.ref.parent.parent))
            let ref = refs.pop();
            ref.get().then(processPoll(
                response,
                refs.slice(),
                []
            ))
        }
    }
}

function processPoll(response, refs, polls) {
    return snapshot => {
        let doc = snapshot.data();
        polls.push({
            name: doc.name,
            description: doc.description,
            finished: doc.finished,
            id: snapshot.id
        });
        if (refs.length > 0) {
            let ref = refs.pop();
            ref.get().then(processPoll(
                response,
                refs.slice(),
                polls
            ));
        } else
            response.status(200).send(polls);
    };
}