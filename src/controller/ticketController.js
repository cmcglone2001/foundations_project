const express = require('express')
const router = express.Router();
const jwt = require('jsonwebtoken');

const ticketService = require("../service/ticketService");
const { authenticateToken } = require("../util/jwt");
const { logger } = require('../util/logger');

router.get("/", authenticateToken, async (req, res) => {
    if (req.user.role != "manager") {
        res.status(403).send("Only managers can check pending tickets. To see your pending tickets, go to localhost:3000/users/tickets");
    } else {
        data = await ticketService.getPendingTickets();
        if (data.length > 0) {
            res.status(200).send(`Pending tickets:\n${JSON.stringify(data)}`)
        }
        else if (data.length == 0) {
            res.status(200).send(`Pending tickets:\nNo pending tickets`)
        } else {
            res.status(400).json({message: `Failed to retrieve pending tickets.\n${JSON.stringify(data)}`})
        }
    }
});

router.post("/", authenticateToken, async (req, res) => {
    const data = await ticketService.postTicket(req.user, req.body);
    //logger.info(`Typeof data: ${typeof data}`);
    if (typeof data === 'number') {
        res.status(201).send(`Ticket ID #${data} created.`);
    } else {
        res.status(400).send(data);
    }
});

router.put("/:ticketId/:response", authenticateToken, async (req, res) => {
    const ticketId = parseInt(req.params.ticketId);
    const response = req.params.response;
    logger.info(`URL Params: ${ticketId} | ${response}`);
    const data = await ticketService.handleTicket(response, ticketId, req.user);
    if (typeof data === 'object') {
        res.status(200).send(`Ticket #${ticketId} successfully processed: ${JSON.stringify(data)}`)
    } else {
        res.status(400).send(data)
    }
});

module.exports = router;