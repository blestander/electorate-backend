const Firestore = require("@google-cloud/firestore");

exports.db = new Firestore({
    projectId: "electorate-274912",
    keyFilename: "credentials.json"
});