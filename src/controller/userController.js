const express = require('express')
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");

const secretKey = "my-secret-key"

const userService = require("../service/userService");
const ticketService = require("../service/ticketService");
const { authenticateToken } = require("../util/jwt");

router.post("/register", validatePostUser, async (req, res) => {
    const data = await userService.postUser(req.body);
    if (data == "taken") {
        res.status(403).send(`Username already taken`);
    } else if (data) {
        res.status(201).send(`Created User: ${req.body.username}`);
    } else {
        res.status(400).json({message: "User not created", data: req.body});
    }
})

router.post("/login", async (req, res) => {
    const {username, password} = req.body;
    const data = await userService.validateLogin(username, password);
    if (data) {
        const token = jwt.sign(
            {
                id: data.user_id,
                username,
                role: data.role
            },
            secretKey,
            {
                expiresIn: "3h"
            }
        );
        res.status(200).send(`Logged in as ${data.role} ${data.username}\nToken: ${token}`);
    } else {
        res.status(400).send("Username or Password is incorrect");
    }
})

router.get("/tickets", authenticateToken, async (req, res) => {
    const data = await ticketService.getTicketsByUsername(req.user.username);
    if (typeof data === 'object') {
        if (data.length > 0) {
            res.status(200).send(`${req.user.username}'s tickets:\n${JSON.stringify(data)}`);
        } else {
            res.status(200).send(`${req.user.username}'s tickets:\nNo tickets found`);
        } 
    } else {
        res.status(400).send(data);
    }
});

function validatePostUser(req, res, next){
    const user = req.body;
    if (user.username && user.password) {
        next();
    } else {
        res.status(400).json({message: "invalid username or password", data: user});
    }
}

module.exports = router;