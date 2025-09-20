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

async function getAllPendingTickets() {
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

async function getTicketsByStatus(username = null, status = null) {
//     logger.info(`Passed to GTBS User: ${username} | Status: ${status}`);
//     let command = null;
//     if (username && status) {
//         logger.info("User and status passed");
//         command = new QueryCommand({
//             TableName,
//             IndexName: "author-status-index",
//             KeyConditionExpression: "#author = :author AND #status = :status",
//             ExpressionAttributeNames: {
//                 "#author" : "author",
//                 "#status" : "status"
//             },
//             ExpressionAttributeValues: {
//                 ":author" : username,
//                 ":status" : status
//             }
//         });
//     } else if (username == null && status) {
//         logger.info("Status passed");
//         command = new QueryCommand({
//             TableName,
//             IndexName: "status-index",
//             KeyConditionExpression: "#status = :status",
//             ExpressionAttributeNames: {"#status" : "status"},
//             ExpressionAttributeValues: {":status" : status}
//         });
//     } else if (username && status == null) {
//         logger.info("User passed");
//         command = new QueryCommand({
//             TableName,
//             IndexName: "author-index",
//             KeyConditionExpression: "#author = :author",
//             ExpressionAttributeNames: {"#author" : "author"},
//             ExpressionAttributeValues: {":author" : username}
//         });
//     } else {
//         return null;
//     }

//     try {
//         const data = await documentClient.send(command);
//         logger.info(`Query command to database complete ${JSON.stringify(data.Items)}`);
//         return data.Items;
//     } catch (error) {
//         logger.error(error);
//         return null;
//     }
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
    getAllPendingTickets,
    getTicketsByStatus,
    getTicketsByUsername,
    getTicketById,
    countTickets
};