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
const { getHistory } = require('./history.js');
const { hostAngular } = require('./angular.js');
const { checkLogin } = require('./check.js');
const { getVoters } = require('./voters.js');
const { getGuilds } = require('./guilds.js');
const { deleteWebhook } = require('./modifyWebhook.js');

const corsOptions = {
    origin: process.env.ORIGIN,
    credentials: true,
    exposedHeaders: 'Location'
}

var app = express();
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use('/', express.static('static'));

// Test Route
app.get('/helloHttp', (request, response) => {
    response.send("Hello, world!")
});

// Angular Routes
app.get('/create', hostAngular);
app.get('/poll/:id', hostAngular);
app.get('/auth', hostAngular);
app.get('/history', hostAngular);

// API Routes
app.post('/api/login', obtainToken);
app.get('/api/poll/:id', getPoll);
app.post('/api/poll/:id/vote', castVote);
app.post('/api/poll/:id/finish', finishPoll);
app.get('/api/poll/:id/voters', getVoters);
app.delete('/api/poll/:id/webhook', deleteWebhook);
app.post('/api/poll/create', createPoll);
app.get('/api/polls', listPolls);
app.delete('/api/poll/:id', deletePoll);
app.get('/api/logout', logout);
app.get('/api/history', getHistory);
app.get('/api/check', checkLogin);
app.get('/api/guilds', getGuilds);

app.listen(process.env.PORT);
