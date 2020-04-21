
exports.helloHTTP = (request, response) => {
    response.send("Hello, world!")
};

exports.token = (request, response) => {
    response.status(200).send(request.body)
}