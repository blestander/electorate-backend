const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');

const { obtainToken } = require('./obtainToken.js');
const { getPoll } = require('./getPoll.js');
const { castVote } = require('./castVote.js');

const corsOptions = {
    origin: 'http://angular.local:4200',
    credentials: true
}

var app = express();
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(bodyParser());

app.get('/helloHttp', (request, response) => {
    response.send("Hello, world!")
});

app.post('/obtainToken', obtainToken);
app.get('/getPoll', getPoll);
app.post('/castVote', castVote);

app.listen(process.env.PORT);
