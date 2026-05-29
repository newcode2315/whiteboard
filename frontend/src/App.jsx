import React, { useEffect, useState } from "react";
import ClientRoom from "./components/ClientRoom";
import JoinCreateRoom from "./components/JoinCreateRoom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import io from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// const server = "https://whiteboard-1kvv.onrender.com";
const server = "http://localhost:8000";
const connectionOptions = {
  "force new connection": true,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
  transports: ["websocket"],
};

const socket = io(server, connectionOptions);

const App = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    socket.on("userIsJoined", (data) => {
      if (data.success) {
        console.log("User joined:", data.usersR);
        setUsers(data.usersR);
      } else {
        console.log("Something went wrong");
      }
    });

    socket.on("allUsers", (data) => {
      console.log("All users:", data);
      setUsers(data);
    });

    socket.on("userJoinedMessage", (data) => {
      // toast.info(`${data} Joined the Room !!!`);
    });

    socket.on("userLeftMessage", (data) => {
      // toast.info(`${data} Left the Room !!!`);
    });

    return () => {
      socket.off("userIsJoined");
      socket.off("allUsers");
    };
  }, []);

  const uuid = () => {
    let s4 = () => {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };

    return (
      s4() +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      s4() +
      s4()
    );
  };

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route
          path="/"
          element={
            <JoinCreateRoom uuid={uuid} socket={socket} setUser={setUser} />
          }
        />
        <Route
          path="/:roomId"
          element={<ClientRoom user={user} socket={socket} users={users} setUsers={setUsers} />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
