const onlineUsers = new Map();

export function addOnlineUser(userId, socketId) {
  onlineUsers.set(userId.toString(), socketId);
}

export function removeOnlineUser(userId) {
  onlineUsers.delete(userId.toString());
}

export function getSocketId(userId) {
  return onlineUsers.get(userId.toString());
}

export function getOnlineUserIds() {
  return [...onlineUsers.keys()];
}
