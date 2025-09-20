const express = require('express')
const router = express.Router();
const jwt = require('jsonwebtoken');

const ticketService = require("../service/ticketService");
const { authenticateToken } = require("../util/jwt");
const { logger } = require('../util/logger');

router.get("/", authenticateToken, async (req, res) => {
    if (req.user.role != "manager") {
        res.status(403).json({message: "Only managers can check pending tickets. To see your pending tickets, go to localhost:3000/users/tickets"});
    } else {
        data = await ticketService.getAllPendingTickets();
        if (data.length > 0) {
            res.status(200).json({message: `Pending tickets:`, tickets: data})
        }
        else if (data.length == 0) {
            res.status(200).json({message: `No pending tickets`})
        } else {
            res.status(400).json({message: `Failed to retrieve pending tickets.`, data: data})
        }
    }
});

router.get("/:status", authenticateToken, async (req, res) => {
//     const status = req.params.status;
//     if (req.user.role != "manager") {
//         res.status(403).json({message: "Only managers can check tickets of other users. To see your tickets, go to localhost:3000/users/tickets/'status'");
//     } else {
//         data = await ticketService.getTicketsByStatus(null, status);
//         if (data.length > 0) {
//             switch (status.toLowerCase()) {
//                 case 'approve' || 'approved': {
//                     res.status(200).json({message: `Approved tickets:\n${JSON.stringify(data)}`);
//                     break;
//                 }
//                 case 'deny' || 'denied': {
//                     res.status(200).json({message: `Denied tickets:\n${JSON.stringify(data)}`)
//                     break;
//                 }
//                 case 'pending': {
//                     res.status(200).json({message: `Pending tickets:\n${JSON.stringify(data)}`)
//                     break;
//                 }
//             }
//         }
//         else if (data.length == 0) {
//             switch (status.toLowerCase()) {
//                 case 'approve' || 'approved': {
//                     res.status(200).json({message: `Approved tickets:\nNo Approved tickets`);
//                     break;
//                 }
//                 case 'deny' || 'denied': {
//                     res.status(200).json({message: `Denied tickets:\nNo Denied tickets`)
//                     break;
//                 }
//                 case 'pending': {
//                     res.status(200).json({message: `Pending tickets:\nNo Pending tickets`)
//                     break;
//                 }
//             }
//         } else {
//             res.status(400).json({message: `Failed to retrieve any tickets.\n${JSON.stringify(data)}`})
//         }
//     }
    res.status(400).json({message: "Not implemented"});
});

router.post("/", authenticateToken, async (req, res) => {
    const data = await ticketService.postTicket(req.user, req.body);
    //logger.info(`Typeof data: ${typeof data}`);
    if (typeof data === 'number') {
        res.status(201).json({message: `Ticket ID #${data} created.`});
    } else {
        res.status(400).json({message: data});
    }
});

router.put("/:ticketId/:response", authenticateToken, async (req, res) => {
    const ticketId = parseInt(req.params.ticketId);
    const response = req.params.response;
    logger.info(`URL Params: ${ticketId} | ${response}`);
    const data = await ticketService.handleTicket(response, ticketId, req.user);
    if (typeof data === 'object') {
        res.status(200).json({message: `Ticket #${ticketId} successfully processed:`, data: data})
    } else {
        res.status(400).json({message: data})
    }
});

module.exports = router;