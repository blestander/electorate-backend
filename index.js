
exports.helloHTTP = (request, response) => {
    response.send("Hello, world!")
};

exports.token = (request, response) => {
    if (handleCORS(request, response, ["POST"]))
        response.status(200).send(request.body)
}

function handleCORS(request, response, methods) {
    response.set('Access-Control-Allow-Origin', '*')

    if (request.method === "OPTIONS") {
        response.set('Access-Control-Allow-Methods', methods.join(','))
        response.set('Access-Control-Allow-Headers', 'Content-Type')
        response.status(204).send('')
        return false;
    } else if (!(methods.includes(request.method))) {
        response.status(405).send('')
        return false;
    } else
        return true;
}