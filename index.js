const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');

const { obtainToken } = require('./obtainToken.js');
const { getPoll } = require('./getPoll.js');
const { castVote } = require('./castVote.js');
const { finishPoll } = require('./finishPoll.js');
const { createPoll } = require('./createPoll.js');
const { listPolls } = require('./listPolls.js');
const { deletePoll } = require('./deletePoll.js');
const { logout } = require('./logout.js');
const { getHistory } = require('./history.js') 

const corsOptions = {
    origin: process.env.ORIGIN,
    credentials: true
}

var app = express();
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(bodyParser.json());

app.get('/helloHttp', (request, response) => {
    response.send("Hello, world!")
});

app.post('/obtainToken', obtainToken);
app.get('/getPoll', getPoll);
app.post('/castVote', castVote);
app.post('/finishPoll', finishPoll);
app.post('/createPoll', createPoll);
app.get('/listPolls', listPolls);
app.post('/deletePoll', deletePoll);
app.get('/logout', logout);
app.get('/history', getHistory);

app.listen(process.env.PORT);
