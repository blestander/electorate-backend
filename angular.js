exports.hostAngular = (request, response) => {
    response.status(200).sendFile('static/index.html')
}