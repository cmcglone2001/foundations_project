const express = require('express')
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");

const secretKey = "my-secret-key"

const userService = require("../service/userService");
const { authenticateToken } = require("../util/jwt");

router.post("/", validatePostUser, async (req, res) => {
    const data = await userService.postUser(req.body);
    if (data == "taken") {
        res.status(403).json({message: "Username already taken", data: req.body.username});
    } else if (data) {
        res.status(201).json({message: `Created User ${JSON.stringify(data)}`});
    } else {
        res.status(400).json({message: "User not created", data: req.body});
    }
} )

router.post("/login", async (req, res) => {
    const {username, password} = req.body;
    const data = await userService.validateLogin(username, password);
    if (data) {
        const token = jwt.sign(
            {
                id: data.user_id,
                username
            },
            secretKey,
            {
                expiresIn: "15m"
            }
        );
        res.status(200).json({message: "You have logged in", token});
    } else {
        res.status(401).json({message: "invalid login"});
    }
})


function validatePostUser(req, res, next){
    const user = req.body;
    if (user.username && user.password) {
        next();
    } else {
        res.status(400).json({message: "invalid username or password", data: user});
    }
}

module.exports = router;