exports.logout = (request, response) => {
    response.cookie("__session", "", {
        httpOnly: true,
        sameSite: "None",
        expires: new Date(Date.now() - 3600)
    });
    response.status(204).end();
};