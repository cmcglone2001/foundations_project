const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { logger } = require("../util/logger");

const client = new DynamoDBClient({region: "us-east-1"});
const documentClient = DynamoDBDocumentClient.from(client);

const TableName = "fp_tickets_table";

async function postTicket(ticket) {
    const command = new PutCommand({
        TableName,
        Item: ticket
    })

    try {
        const data = await documentClient.send(command);
        logger.info(`PUT command to databse complete ${JSON.stringify(data)}`);
        return data;
    } catch (error) {
        logger.error(error);
        return null;
    }
}

async function getPendingTickets() {
    const command = new QueryCommand({
        TableName,
        IndexName: "status-index",
        KeyConditionExpression: "#status = :status",
        ExpressionAttributeNames: {"#status" : "status"},
        ExpressionAttributeValues: {":status" : "Pending"}
    });

    try {
        const data = await documentClient.send(command);
        logger.info(`Query command to database complete ${JSON.stringify(data.Items)}`);
        return data.Items;
    } catch (error) {
        logger.error(error);
        return null;
    }
}

async function getTicketsByUsername(username) {
    const command = new QueryCommand({
        TableName,
        IndexName: "author-index",
        KeyConditionExpression: "#author = :author",
        ExpressionAttributeNames: {"#author" : "author"},
        ExpressionAttributeValues: {":author" : username}
    });

    try {
        const data = await documentClient.send(command);
        logger.info(`Query command to database complete ${JSON.stringify(data)}`);
        return data.Items;
    } catch (error) {
        logger.error(error);
        return null;
    }
}

async function getTicketById(ticketId) {
    const command = new QueryCommand({
        TableName,
        KeyConditionExpression: "#id = :id",
        ExpressionAttributeNames: {"#id" : "ticket_id"},
        ExpressionAttributeValues: {":id" : ticketId}
    });

    try {
        const data = await documentClient.send(command);
        logger.info(`Query command to database complete ${JSON.stringify(data)}`);
        return data.Items[0];
    } catch (error) {
        logger.error(error);
        return null;
    }
}

async function countTickets() {
    const command = new ScanCommand({
            TableName,
            Select: "COUNT"
        });
    
        try {
            const data = await documentClient.send(command);
            logger.info(`SCAN command to database complete ${JSON.stringify(data)}`);
            return data.Count;
        } catch (error) {
            logger.error(error);
            return null;
        }
}

module.exports = {
    postTicket,
    getPendingTickets,
    getTicketsByUsername,
    getTicketById,
    countTickets
};