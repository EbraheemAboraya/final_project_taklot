// Initialize a map to hold userId -> socketId mappings
let userSockets = new Map();

// Adds a user socket to the map
function addUserSocket(userId, socketId) {
    userSockets.set(userId, socketId);
}

// Retrieves a user's socket ID by their user ID
function getUserSocket(userId) {
    return userSockets.get(userId);
}

// Removes a user socket from the map by their user ID
function removeUserSocket(userId) {
    userSockets.delete(userId);
}

// Exporting the functions for use in other files
module.exports = { addUserSocket, getUserSocket, removeUserSocket };
