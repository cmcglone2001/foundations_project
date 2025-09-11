const express = require('express');
const app = express();
const {logger, loggerMiddleware} = require('./util/logger');
const {authenticateToken} = require("./util/jwt");

const userController = require('./controller/userController');

const PORT = 3000;

app.use(express.json());
app.use(loggerMiddleware);

app.use("/users", userController);

app.get("/", (req, res) => {
    res.send("Home Page");
})

app.get("/protected", authenticateToken, (req, res) => {
    res.json({message: "Accessed Protected Route", user: req.user});
})

app.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
})