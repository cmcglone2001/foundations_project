const userDAO = require('../repository/userDAO');
const bcrypt = require('bcrypt');
const { logger } = require("../util/logger")

const secretKey = "my-secret-key";

async function postUser(user) {
    const saltRounds = 10;
    if (validateUser(user)) {

        if (await isUsernameAvailable(user.username) == true) {
            const password = await bcrypt.hash(user.password, saltRounds);
            const data = await userDAO.postUser({
                username: user.username,
                password,
                role: "employee",
                user_id: crypto.randomUUID()
            })
            logger.info(`Creating new user: ${JSON.stringify(data)}`);
            return data;
        } else {
            logger.info("Registration failed: Username already taken")
            return "taken";
        }

    } else {
        logger.info(`Failed to validate user: ${JSON.stringify(user)}`);
        return null;
    }
}

async function validateLogin(username, password) {
    const user = await getUserByUsername(username);
    if (user && (await bcrypt.compare(password, user.password))) {
        logger.info(`User logged in successfully`)
        return user;
    } else {
        logger.info(`User credentials mismatch`);
        return null;
    }
}

async function getUserByUsername(username){
    if (username) {
        const data = await userDAO.getUserByUsername(username);
        if (data) {
            logger.info(`User found by username: ${JSON.stringify(data)}`);
            return data;
        } else {
            logger.info(`User not found by username: ${username}`);
            return null;
        }
    }
}

async function isUsernameAvailable(username){
    if (username) {
        const data = await userDAO.getUserByUsername(username);
        if (data) {
            logger.info(`Username taken: ${JSON.stringify(data)}`);
            return false;
        } else {
            logger.info(`User not found by username: ${username}`);
            return true;
        }
    }
}

async function getUserById(userId) {
    if (userId) {
        const data = await userDAO.getUserById(userId);
        if (data) {
            logger.info(`User found by id: ${JSON.stringify(data)}`);
            return data;
        } else {
            logger.info(`User not found by id: ${userId}`);
            return null;
        }
    }
}

function validateUser(user) {
    const usernameResult = user.username.length > 0;
    const passwordResult = user.password.length > 0;
    return (usernameResult && passwordResult);
}

module.exports = {
    postUser,
    validateLogin,
    getUserById
}