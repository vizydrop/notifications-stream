module.exports = (res) => {
    res.writeHead(200, {
        "Content-Type": `application/json`,
        "X-Accel-Buffering": `no`,
    });
};
