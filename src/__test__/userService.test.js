const userDAO = require('../repository/userDAO');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

jest.mock('../repository/userDAO');
jest.mock('bcrypt');
jest.mock('../util/logger');

const userService = require('../service/userService');

describe('User Service', () => {
    let newUser, existingUser;

    beforeEach(() => {
        newUser = { username: 'Twin', password: 'Turbo' };

        existingUser = {
            username: 'Rice',
            password: 'Shower',
            user_id: 'GOAT',
            role: 'employee'
        };

        jest.clearAllMocks();
    })

    describe('postUser', () => {
        it('should create a user if username is available and valid', async () => {
            userDAO.getUserByUsername.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashedPassword');
            const fakeUUID = 'fakeUUID';
            const expectedUser = {
                username: newUser.username,
                password: 'hashedPassword',
                role: 'employee',
                user_id: fakeUUID
            };

            jest.spyOn(crypto, 'randomUUID').mockReturnValue(fakeUUID);
            userDAO.postUser.mockResolvedValue(expectedUser);

            const result = await userService.postUser(newUser);

            expect(userDAO.getUserByUsername).toHaveBeenCalledWith(newUser.username);
            expect(bcrypt.hash).toHaveBeenCalledWith(newUser.password, 10);
            expect(userDAO.postUser).toHaveBeenCalledWith(expectedUser);
            expect(result).toEqual(expectedUser);
        });

        it('should return "taken" if username is already in use', async () => {
            userDAO.getUserByUsername.mockResolvedValue(existingUser);

            const result = await userService.postUser(newUser)
            expect(result).toBe("taken");
        })

        it('should return null if user data is invalid', async () => {
            const result = await userService.postUser({ username: '', password: '' });
            expect(result).toBeNull();
        });
    });

    describe('validateLogin', () => {
        it('should return user object on valid credentials', async () => {
            userDAO.getUserByUsername.mockResolvedValue(existingUser);
            bcrypt.compare.mockResolvedValue(true);

            const result = await userService.validateLogin(existingUser.username, 'correctPassword');
            expect(userDAO.getUserByUsername).toHaveBeenCalledWith(existingUser.username);
            expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', existingUser.password);
            expect(result).toEqual(existingUser);
        });

        it('should return null on invalid password', async () => {
            userDAO.getUserByUsername.mockResolvedValue(existingUser);
            bcrypt.compare.mockResolvedValue(false);

            const result = await userService.validateLogin(existingUser.username, 'wrongPassword');
            expect(result).toBeNull();
        });

        it('should return null if user not found', async () => {
            userDAO.getUserByUsername.mockResolvedValue(null);
            const result = await userService.validateLogin('fakeUser', 'pass');
            expect(result).toBeNull();
        });
    });

    describe('getUserById', () => {
        it('should return user if found', async () => {
            userDAO.getUserById.mockResolvedValue(existingUser)
            const result = await userService.getUserById(existingUser.user_id)
            expect(result).toEqual(existingUser)
        });

        it('should return null if user not found', async () => {
            userDAO.getUserById.mockResolvedValue(null)
            const result = await userService.getUserById('missingId')
            expect(result).toBeNull()
        });
    });
})