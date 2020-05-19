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

// Test Route
app.get('/helloHttp', (request, response) => {
    response.send("Hello, world!")
});

// API Routes
app.post('/api/login', obtainToken);
app.get('/api/getPoll', getPoll);
app.post('/api/castVote', castVote);
app.post('/api/finishPoll', finishPoll);
app.post('/api/createPoll', createPoll);
app.get('/api/polls', listPolls);
app.post('/api/deletePoll', deletePoll);
app.get('/api/logout', logout);
app.get('/api/history', getHistory);

app.listen(process.env.PORT);
