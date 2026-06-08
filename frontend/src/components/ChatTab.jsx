import React, { useEffect, useState, useRef } from "react";

const ChatTab = ({ socket }) => {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleMessageResponse = (data) => {
      setChat((prevChats) => [...prevChats, data]);
    };

    socket.on("messageResponse", handleMessageResponse);

    return () => {
      socket.off("messageResponse", handleMessageResponse);
    };
  }, [socket]);

  // Scroll to bottom whenever chat updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() !== "") {
      socket.emit("message", { message: message.trim() });
      setChat((prevChats) => [...prevChats, { message: message.trim(), name: "You" }]);
      setMessage("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)" }}>
      {/* Chat Messages Area */}
      <div className="chat-container">
        {chat.map((msg, index) => {
          const isMe = msg.name === "You";
          return (
            <div
              key={index}
              className={`chat-bubble ${isMe ? "me" : "other"}`}
            >
              {!isMe && <span className="chat-sender-name">{msg.name}</span>}
              <div>{msg.message}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSubmit} className="mt-auto pt-2">
        <div className="input-group">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="form-control-premium"
            style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            required
          />
          <button
            type="submit"
            className="btn btn-premium px-3"
            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatTab;
