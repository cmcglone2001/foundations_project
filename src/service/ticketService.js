const ticketDAO = require('../repository/ticketDAO');
const { logger } = require("../util/logger");

let nextId = 0;

async function postTicket(user, ticket) {
    //logger.info(`Count - ${nextId}`);
    if (validateTicket(ticket)) {
        const data = await ticketDAO.postTicket({
            ticket_id: nextId,
            amount: ticket.amount,
            description: ticket.description,
            author: user.username,
            resolver: "",
            status: "Pending"
        })
        logger.info(`Creating new ticket: ${JSON.stringify(data)}`);
        nextId++;
        return nextId-1;
    } else {
        let message = "Ticket submission failed:";
        if (ticket.amount == undefined || ticket.amount <= 0) { message += "\nTicket must have an amount"};
        if (ticket.description == undefined || ticket.description.length <= 0) { message += "\nTicket must have a description"};
        logger.info(`Failed to validate ticket: ${JSON.stringify(ticket)}`);
        return message;
    }
}

async function getPendingTickets() {
    const data = await ticketDAO.getPendingTickets();
    if (data) {
        logger.info(`Pending tickets found: ${JSON.stringify(data)}`);
        return data.sort((a,b) => a.ticket_id - b.ticket_id);
    } else {
        logger.info(`Something went horribly wrong: ${JSON.stringify(data)}`);
        return null;
    }
    
}

async function getTicketsByUsername(username) {
    if (username) {
        const data = await ticketDAO.getTicketsByUsername(username);
        if (data) {
            logger.info(`Tickets found by username: ${JSON.stringify(data)}`);
            return data.sort((a,b) => a.ticket_id - b.ticket_id);
        } else {
            logger.info(`Error searching for tickets by username: ${username}`);
            return "An error has occured";
        }
    } else {
        logger.info(`No username found: ${username}`)
        return "Username not found"
    }
}

async function getTicketById(ticketId) {
    if (ticketId) {
        const data = await ticketDAO.getTicketById(ticketId);
        if (data) {
            logger.info(`Ticket found by id: ${JSON.stringify(data)}`);
            return data;
        } else {
            logger.info(`Ticket not found by id: ${ticketId}`);
            return null;
        }
    }
}

async function handleTicket(response, ticketId, user) {
    if (user.role == "manager") {
        const ticket = await verifyLegalProcess(ticketId, response);
        logger.info(`Verified ticket: ${JSON.stringify(ticket)}`)
        if (typeof ticket === 'object') {
            let updatedTicket = ticket;
            updatedTicket.status = (response.toLowerCase() === 'approve') ? "Approved" : "Denied";
            updatedTicket.resolver = user.username;
            logger.info(`Updated ticket: ${JSON.stringify(updatedTicket)}`);
            const data = await ticketDAO.postTicket(updatedTicket);
            if (data) {
                logger.info(`Ticket response processed: ${JSON.stringify(data)}`);
                return data;
            } else {
                logger.info(`Ticket response failed: ${JSON.stringify(data)}`);
                return null;
            }
        } else {
            logger.info("Ticket not found or already processed.")
            return ticket;
        }
    } else {
        logger.info("Employee attempted to handle ticket");
        return "Employees cannot handle tickets.";
    }
}

async function verifyLegalProcess(ticketId, response) {
    const ticket = await getTicketById(ticketId);
    //logger.info(`Ticket in VLP: ${JSON.stringify(ticket)}`)
    if (response.toLowerCase() !== "approve" && response.toLowerCase() !== "deny") {
        return "Ticket response must be either 'Approve' or 'Deny'";
    }

    if (ticket && ticket.status == "Pending") { return ticket; }
    else if (ticket && ticket.status != "Pending") { return `Ticket #${ticketId} has already been processed\n${JSON.stringify(ticket)}`; }
    else { return `Ticket #${ticketId} not found`; }
}

function validateTicket(ticket) {
    const amountResult = ticket.amount > 0;
    let descriptionResult = null;
    if (ticket.description != null) { descriptionResult = ticket.description.length > 0; }
    else { return false; }
    return (amountResult && descriptionResult);
}

function checkAccess(user) {
    return user.role == "manager";
}

async function countTickets() {
    nextId = await ticketDAO.countTickets()+1;
}

countTickets();

module.exports = {
    postTicket,
    getPendingTickets,
    getTicketsByUsername,
    getTicketById,
    handleTicket,
    checkAccess
}