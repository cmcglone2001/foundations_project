const ticketDAO = require('../repository/ticketDAO');
const ticketService = require('../service/ticketService');

jest.mock('../repository/ticketDAO');
jest.mock('../util/logger');

describe('Ticket Service', () => {
    let userEmployee, userManager, validTicket, invalidTicket;

    beforeEach(() => {
        userEmployee = { username: 'Illya', role: 'employee' };
        userManager = { username: 'Chloe', role: 'manager' };

        validTicket = {
            amount: 100,
            description: "Travel reimbursement"
        };

        invalidTicket = {
            amount: 0,
            description: ""
        };

        ticketDAO.postTicket.mockClear();
        ticketDAO.getAllPendingTickets.mockClear();
        ticketDAO.getTicketById.mockClear();
        ticketDAO.getTicketsByUsername.mockClear();
        ticketDAO.countTickets.mockResolvedValue(0);
    });

    describe('postTicket', () => {
        it('should reject manager from submitting tickets', async () => {
            const res = await ticketService.postTicket(userManager, validTicket);
            expect(res).toBe("Managers cannot submit tickets");
        });

        it('should create a ticket if valid and user is employee', async () => {
            ticketDAO.postTicket.mockResolvedValue({ ...validTicket, ticket_id: 1 });

            const res = await ticketService.postTicket(userEmployee, validTicket);

            expect(ticketDAO.postTicket).toHaveBeenCalledWith(expect.objectContaining({
                ticket_id: 1,
                author: userEmployee.username,
                status: "Pending"
            }));
            expect(res).toBe(0);
        });

        it('should return validation error message for invalid ticket', async () => {
            const res = await ticketService.postTicket(userEmployee, invalidTicket);
            expect(res).toContain("Ticket must have an amount");
            expect(res).toContain("Ticket must have a description");
        });
    });

    describe('getAllPendingTickets', () => {
        it('should return sorted list of pending tickets', async () => {
            ticketDAO.getAllPendingTickets.mockResolvedValue([
                { ticket_id: 2 }, { ticket_id: 1 }, { ticket_id: 3 }
            ]);

            const res = await ticketService.getAllPendingTickets();
            expect(res.map(t => t.ticket_id)).toEqual([1, 2, 3]);
        });

        it('should return null if no data returned', async () => {
            ticketDAO.getAllPendingTickets.mockResolvedValue(null);
            const res = await ticketService.getAllPendingTickets();
            expect(res).toBeNull();
        });
    });

    describe('getTicketsByUsername', () => {
        it('should return sorted tickets if username is valid', async () => {
            ticketDAO.getTicketsByUsername.mockResolvedValue([
                { ticket_id: 4 }, { ticket_id: 1 }
            ]);

            const res = await ticketService.getTicketsByUsername('Illya');
            expect(res.map(t => t.ticket_id)).toEqual([1, 4]);
        });

        it('should return error message if no data', async () => {
            ticketDAO.getTicketsByUsername.mockResolvedValue(null);
            const res = await ticketService.getTicketsByUsername('Illya');
            expect(res).toBe("An error has occured");
        });

        it('should return error if username is undefined', async () => {
            const res = await ticketService.getTicketsByUsername(undefined);
            expect(res).toBe("Username not found");
        });
    });

    describe('getTicketById', () => {
        it('should return ticket if found', async () => {
            const ticket = { ticket_id: 5 };
            ticketDAO.getTicketById.mockResolvedValue(ticket);

            const res = await ticketService.getTicketById(5);
            expect(res).toEqual(ticket);
        });

        it('should return null if ticket not found', async () => {
            ticketDAO.getTicketById.mockResolvedValue(null);
            const res = await ticketService.getTicketById(99);
            expect(res).toBeNull();
        });
    });

    describe('handleTicket', () => {
        it('should reject non-manager users', async () => {
            const res = await ticketService.handleTicket("approve", 1, userEmployee);
            expect(res).toBe("Employees cannot handle tickets.");
        });

        it('should approve a valid ticket', async () => {
            const ticket = {
                ticket_id: 1,
                amount: 100,
                description: "Test",
                status: "Pending",
                resolver: ""
            };

            ticketDAO.getTicketById.mockResolvedValue(ticket);
            ticketDAO.postTicket.mockResolvedValue({ ...ticket, status: "Approved", resolver: userManager.username });

            const res = await ticketService.handleTicket("approve", 1, userManager);

            expect(ticketDAO.postTicket).toHaveBeenCalledWith(expect.objectContaining({
                status: "Approved",
                resolver: userManager.username
            }));
            expect(res.status).toBe("Approved");
        });

        it('should deny a valid ticket', async () => {
            const ticket = {
                ticket_id: 2,
                amount: 100,
                description: "Test",
                status: "Pending",
                resolver: ""
            };

            ticketDAO.getTicketById.mockResolvedValue(ticket);
            ticketDAO.postTicket.mockResolvedValue({ ...ticket, status: "Denied", resolver: userManager.username });

            const res = await ticketService.handleTicket("deny", 2, userManager);
            expect(res.status).toBe("Denied");
        });

        it('should reject invalid response string', async () => {
            ticketDAO.getTicketById.mockResolvedValue({
                ticket_id: 1,
                status: "Pending"
            });

            const res = await ticketService.handleTicket("maybe", 1, userManager);
            expect(res).toBe("Ticket response must be either 'Approve' or 'Deny'");
        });

        it('should reject already processed ticket', async () => {
            ticketDAO.getTicketById.mockResolvedValue({
                ticket_id: 1,
                status: "Approved"
            });

            const res = await ticketService.handleTicket("approve", 1, userManager);
            expect(res).toContain("already been processed");
        });

        it('should return error if ticket not found', async () => {
            ticketDAO.getTicketById.mockResolvedValue(null);
            const res = await ticketService.handleTicket("approve", 404, userManager);
            expect(res).toBe("Ticket #404 not found");
        });
    });

    describe('checkAccess', () => {
        it('should return true for manager role', () => {
            expect(ticketService.checkAccess(userManager)).toBe(true);
        });

        it('should return false for employee role', () => {
            expect(ticketService.checkAccess(userEmployee)).toBe(false);
        });
    })
});