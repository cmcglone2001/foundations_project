const jwt = require("jsonwebtoken");
const { logger } = require("./logger");

const secretKey = "my-secret-key";

async function authenticateToken(req, res, next) {

    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        res.status(403).send("Forbidden access");
    } else {
        const user = await decodeJWT(token);
        if (user) {
            req.user = user;
            logger.info(`Token authenticated: ${JSON.stringify(req.user)}`)
            next();
        } else {
            res.status(400).send("Bad JWT");
        }
    }
}

async function decodeJWT(token){
    try {
        const user = await jwt.verify(token, secretKey);
        return user;
    } catch (error) {
        logger.error(error);
        return null;
    }
}

module.exports = {
    authenticateToken
};