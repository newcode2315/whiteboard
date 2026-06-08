import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Canvas from "./Canvas.jsx";
import ChatTab from "./ChatTab.jsx";

// Icons
import { RiDeleteBinLine } from "react-icons/ri";
import { BsFillPencilFill } from "react-icons/bs";
import { FaLinesLeaning, FaEraser } from "react-icons/fa6";
import { PiRectangleDuotone } from "react-icons/pi";
import { ImUndo2, ImRedo2 } from "react-icons/im";
import {
  FiDownload,
  FiUsers,
  FiMessageSquare,
  FiCopy,
  FiCheck,
  FiLogOut,
} from "react-icons/fi";

const uuid = () => {
  const s4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

const ClientRoom = ({ socket, setUsers, user, setUser, users }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const ctx = useRef(null);

  // Drawing state
  const [color, setColor] = useState("#8b5cf6"); // Default purple accent
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [tool, setTool] = useState("pencil");
  const [brushWidth, setBrushWidth] = useState(3);

  // UI state
  const [openedUserTab, setOpenedUserTab] = useState(false);
  const [openedChatTab, setOpenedChatTab] = useState(false);
  const [copied, setCopied] = useState(false);

  // Direct Join modal state
  const [showJoinModal, setShowJoinModal] = useState(!user);
  const [nameInput, setNameInput] = useState("");

  // Quick preset colors
  const colorsList = [
    "#000000", // Black
    "#ffffff", // White
    "#ef4444", // Red
    "#3b82f6", // Blue
    "#10b981", // Green
    "#f59e0b", // Orange
    "#8b5cf6", // Purple
    "#ec4899", // Pink
  ];

  // Listen to users join/leave events
  useEffect(() => {
    const handleAllUsers = (updatedUsers) => {
      setUsers(updatedUsers);
    };

    const handleUserLeftMessage = (data) => {
      toast.error(`${data} left the room.`);
    };

    const handleUserJoinedMessage = (name) => {
      toast.success(`${name} joined the room!`);
    };

    socket.on("allUsers", handleAllUsers);
    socket.on("userLeftMessage", handleUserLeftMessage);
    socket.on("userJoinedMessage", handleUserJoinedMessage);

    // Re-register if user details are present (e.g. initial landing page navigation)
    if (user) {
      socket.emit("userJoined", user);
    }

    return () => {
      socket.off("allUsers", handleAllUsers);
      socket.off("userLeftMessage", handleUserLeftMessage);
      socket.off("userJoinedMessage", handleUserJoinedMessage);
    };
  }, [socket, setUsers, user]);

  const handleJoinModalSubmit = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      toast.warning("Please enter a valid name.");
      return;
    }

    const roomData = {
      name: nameInput.trim(),
      roomId: roomId,
      userId: uuid(),
      host: false,
      presenter: false, // Default newly joined url users to participants
    };

    setUser(roomData);
    setShowJoinModal(false);
    toast.success(`Joined room: ${roomId}`);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    toast.success("Room ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    setElements([]);
    setHistory([]);
  };

  const undo = () => {
    if (elements.length === 0) return;
    const newHistory = [...history, elements[elements.length - 1]];
    const newElements = elements.slice(0, -1);
    setHistory(newHistory);
    setElements(newElements);
  };

  const redo = () => {
    if (history.length === 0) return;
    const newElements = [...elements, history[history.length - 1]];
    const newHistory = history.slice(0, -1);
    setElements(newElements);
    setHistory(newHistory);
  };

  const downloadWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas with white background (so drawing doesn't save as transparent)
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    // Fill white
    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw original canvas (which has scale 2x applied)
    tempCtx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `whiteboard-${roomId}.png`;
    link.href = tempCanvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Whiteboard downloaded successfully!");
  };

  const handleExit = () => {
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="whiteboard-layout">
      {/* Modal for Direct URL Users */}
      {showJoinModal && (
        <div className="modal-overlay">
          <div className="modal-content-glass">
            <h2 className="mb-4 gradient-title">Join Workspace</h2>
            <p className="text-muted mb-4 small">
              You've been invited to join a collaborative whiteboard. Enter your name to enter.
            </p>
            <form onSubmit={handleJoinModalSubmit}>
              <div className="form-group-premium">
                <label className="form-label-premium">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  className="form-control-premium"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <button type="submit" className="btn-premium w-100 mt-2">
                Join Room
              </button>
              <button
                type="button"
                className="btn-premium-outline w-100 mt-2 text-muted"
                onClick={() => navigate("/")}
              >
                Go to Home Page
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Top Navbar Header */}
      <div className="header-row">
        <div className="d-flex align-items-center gap-3">
          <div>
            <h1 className="h3 gradient-title mb-1">Collaborative Canvas</h1>
            <p className="text-muted mb-0 small">
              Room ID: <span className="text-white font-weight-bold">{roomId}</span>
            </p>
          </div>
          <button
            className="btn btn-premium-outline btn-icon-only btn-sm"
            onClick={copyRoomId}
            title="Copy Room ID"
            style={{ width: "32px", height: "32px", fontSize: "0.85rem" }}
          >
            {copied ? <FiCheck className="text-success" /> : <FiCopy />}
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setOpenedUserTab(true);
              setOpenedChatTab(false);
            }}
            className="btn-premium-outline"
            title="Active Users"
          >
            <FiUsers /> <span className="d-none d-md-inline">Users ({users.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenedChatTab(true);
              setOpenedUserTab(false);
            }}
            className="btn-premium-outline"
            title="Chat Room"
          >
            <FiMessageSquare /> <span className="d-none d-md-inline">Chat</span>
          </button>
          <button
            type="button"
            onClick={handleExit}
            className="btn-premium-outline text-danger border-danger-subtle"
            title="Exit Room"
          >
            <FiLogOut /> <span className="d-none d-md-inline">Leave</span>
          </button>
        </div>
      </div>

      {/* User Sidebar Drawer */}
      <div
        className="glass-sidebar"
        style={{ transform: openedUserTab ? "translateX(0)" : "translateX(-100%)" }}
      >
        <div className="sidebar-header">
          <span className="sidebar-title">Active Workspace</span>
          <button
            type="button"
            onClick={() => setOpenedUserTab(false)}
            className="sidebar-close"
          >
            &times;
          </button>
        </div>

        <div className="form-group-premium mt-3">
          <label className="form-label-premium">Invite Collaborators</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control-premium text-muted small"
              value={roomId}
              disabled
              readOnly
              style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            />
            <button
              className="btn btn-premium btn-icon-only"
              onClick={copyRoomId}
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            >
              {copied ? <FiCheck className="text-success" /> : <FiCopy />}
            </button>
          </div>
        </div>

        <label className="form-label-premium mt-3">Connected Users</label>
        <div style={{ flexGrow: 1, overflowY: "auto" }}>
          {users.map((usr, index) => (
            <div className="user-item" key={index}>
              <div className="user-avatar">
                {usr.name ? usr.name.charAt(0).toUpperCase() : "?"}
              </div>
              <div className="user-details">
                <span className="user-name">{usr.name}</span>
              </div>
              <div className="d-flex gap-1">
                {usr.presenter && <span className="badge-presenter">Host</span>}
                {user && user.userId === usr.userId && <span className="badge-you">You</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Sidebar Drawer */}
      <div
        className="glass-sidebar sidebar-right"
        style={{ transform: openedChatTab ? "translateX(0)" : "translateX(100%)" }}
      >
        <div className="sidebar-header">
          <span className="sidebar-title">Group Chat</span>
          <button
            type="button"
            onClick={() => setOpenedChatTab(false)}
            className="sidebar-close"
          >
            &times;
          </button>
        </div>
        <ChatTab setOpenedChatTab={setOpenedChatTab} socket={socket} user={user} />
      </div>

      {/* Toolbars & Whiteboard Area (Only visible when user has joined) */}
      {!showJoinModal && (
        <>
          {/* Presenter Tools toolbar */}
          {user?.presenter ? (
            <div className="floating-toolbar">
              {/* Drawing Tools */}
              <div className="tool-group">
                <button
                  className={`btn btn-premium-outline btn-icon-only ${tool === "pencil" ? "active btn-premium" : ""}`}
                  onClick={() => setTool("pencil")}
                  title="Pencil Tool"
                >
                  <BsFillPencilFill />
                </button>
                <button
                  className={`btn btn-premium-outline btn-icon-only ${tool === "line" ? "active btn-premium" : ""}`}
                  onClick={() => setTool("line")}
                  title="Line Tool"
                >
                  <FaLinesLeaning />
                </button>
                <button
                  className={`btn btn-premium-outline btn-icon-only ${tool === "rect" ? "active btn-premium" : ""}`}
                  onClick={() => setTool("rect")}
                  title="Rectangle Tool"
                >
                  <PiRectangleDuotone />
                </button>
                <button
                  className={`btn btn-premium-outline btn-icon-only ${tool === "eraser" ? "active btn-premium" : ""}`}
                  onClick={() => setTool("eraser")}
                  title="Eraser"
                >
                  <FaEraser />
                </button>
              </div>

              {/* Color Presets */}
              {tool !== "eraser" && (
                <div className="tool-group px-2 d-flex gap-1">
                  {colorsList.map((c, i) => (
                    <button
                      key={i}
                      className={`preset-color-btn ${color === c ? "active" : ""}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                  {/* Custom color picker */}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{
                      width: "26px",
                      height: "26px",
                      border: "none",
                      padding: 0,
                      background: "none",
                      cursor: "pointer",
                    }}
                    title="Custom Color"
                  />
                </div>
              )}

              {/* Brush size */}
              <div className="tool-group d-flex align-items-center gap-2">
                <span className="small text-muted font-weight-bold">Size:</span>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={brushWidth}
                  onChange={(e) => setBrushWidth(parseInt(e.target.value))}
                  style={{ width: "70px", accentColor: "var(--accent-color)" }}
                />
                <span className="small text-white font-weight-bold" style={{ minWidth: "15px" }}>
                  {brushWidth}
                </span>
              </div>

              {/* Undo / Redo Actions */}
              <div className="tool-group">
                <button
                  type="button"
                  className="btn btn-premium-outline btn-icon-only"
                  disabled={elements.length === 0}
                  onClick={undo}
                  title="Undo"
                >
                  <ImUndo2 />
                </button>
                <button
                  type="button"
                  className="btn btn-premium-outline btn-icon-only"
                  disabled={history.length === 0}
                  onClick={redo}
                  title="Redo"
                >
                  <ImRedo2 />
                </button>
              </div>

              {/* Extras: Clear, Download */}
              <div className="tool-group">
                <button
                  type="button"
                  className="btn btn-premium-outline btn-icon-only text-danger border-danger-subtle"
                  onClick={clearCanvas}
                  title="Clear Canvas"
                >
                  <RiDeleteBinLine />
                </button>
                <button
                  type="button"
                  className="btn btn-premium btn-icon-only"
                  onClick={downloadWhiteboard}
                  title="Download Image"
                >
                  <FiDownload />
                </button>
              </div>
            </div>
          ) : (
            // Viewer layout info header
            <div className="floating-toolbar bg-dark-subtle border border-light-subtle rounded py-2 px-3 small d-flex gap-2 align-items-center">
              <span className="spinner-grow spinner-grow-sm text-success" role="status" />
              <span>Viewing Host's Whiteboard</span>
              <button
                type="button"
                className="btn btn-premium btn-icon-only btn-sm ml-3"
                onClick={downloadWhiteboard}
                title="Download Whiteboard"
              >
                <FiDownload />
              </button>
            </div>
          )}

          {/* Canvas Component Area */}
          <div className="row flex-grow-1">
            <Canvas
              canvasRef={canvasRef}
              ctx={ctx}
              color={color}
              setElements={setElements}
              elements={elements}
              tool={tool}
              socket={socket}
              user={user}
              brushWidth={brushWidth}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ClientRoom;
