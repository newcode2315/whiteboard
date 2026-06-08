import { Socket } from "socket.io";

const users = [];

export const addUser = ({
  name,
  userId,
  roomId,
  host,
  presenter,
  socketId,
}) => {
  const index = users.findIndex((user) => user.socketId === socketId);
  const user = { name, userId, roomId, host, presenter, socketId };
  if (index !== -1) {
    users[index] = user;
  } else {
    users.push(user);
  }
  return users;
};

export const removeUser = (id) => {
  const index = users.findIndex((user) => user.socketId === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
  return users;
};

export const getUser = (id) => {
  return users.find((user) => user.socketId === id);
};

export const getUsersInRoom = (roomId) => {
  return users.filter((user) => user.roomId === roomId);
};
