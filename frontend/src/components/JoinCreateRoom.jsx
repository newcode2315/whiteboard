import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiPlus, FiLogIn, FiRefreshCw, FiCopy, FiCheck } from "react-icons/fi";

const JoinCreateRoom = ({ uuid, socket, setUser }) => {
  const [roomId, setRoomId] = useState(uuid());
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    toast.success("Room ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("Please enter your name to create a room.");
      return;
    }

    const roomData = {
      name: name.trim(),
      roomId,
      userId: uuid(),
      host: true,
      presenter: true,
    };

    setUser(roomData);
    toast.success("Room created successfully!");
    navigate(`/${roomId}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!joinName.trim()) {
      toast.warning("Please enter your name to join.");
      return;
    }
    if (!joinRoomId.trim()) {
      toast.warning("Please enter a Room ID.");
      return;
    }

    const roomData = {
      name: joinName.trim(),
      roomId: joinRoomId.trim(),
      userId: uuid(),
      host: false,
      presenter: false,
    };

    setUser(roomData);
    toast.success("Joining room...");
    navigate(`/${joinRoomId.trim()}`);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center text-center mb-5">
        <div className="col-lg-8">
          <h1 className="display-4 font-weight-bold gradient-title mb-3">
            Realtime Collaborative Whiteboard
          </h1>
          <p className="lead text-muted">
            Create a workspace, draw with rich tools, share ideas in real-time, and chat with your team.
          </p>
        </div>
      </div>

      <div className="row justify-content-center gap-4 px-2">
        {/* Create Room Card */}
        <div className="col-md-5 glass-card mb-4">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div
              className="user-avatar"
              style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
            >
              <FiPlus size={20} />
            </div>
            <h2 className="h4 mb-0 text-white font-weight-bold">Create Room</h2>
          </div>

          <form onSubmit={handleCreateRoom}>
            <div className="form-group-premium">
              <label className="form-label-premium">Your Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                className="form-control-premium"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group-premium">
              <label className="form-label-premium">Room ID</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control-premium text-white font-weight-bold"
                  value={roomId}
                  readOnly
                  style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                />
                <button
                  className="btn btn-premium-outline btn-icon-only"
                  type="button"
                  onClick={copyRoomId}
                  title="Copy Room ID"
                >
                  {copied ? <FiCheck className="text-success" /> : <FiCopy />}
                </button>
                <button
                  className="btn btn-premium-outline btn-icon-only"
                  type="button"
                  onClick={() => setRoomId(uuid())}
                  style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                  title="Generate New ID"
                >
                  <FiRefreshCw />
                </button>
              </div>
            </div>

            <button type="submit" className="btn-premium w-100 mt-4">
              <FiPlus /> Create Room
            </button>
          </form>
        </div>

        {/* Join Room Card */}
        <div className="col-md-5 glass-card mb-4">
          <div className="d-flex align-items-center gap-3 mb-4">
            <div
              className="user-avatar"
              style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}
            >
              <FiLogIn size={20} />
            </div>
            <h2 className="h4 mb-0 text-white font-weight-bold">Join Room</h2>
          </div>

          <form onSubmit={handleJoinRoom}>
            <div className="form-group-premium">
              <label className="form-label-premium">Your Name</label>
              <input
                type="text"
                placeholder="e.g. Jane Smith"
                className="form-control-premium"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                required
              />
            </div>

            <div className="form-group-premium">
              <label className="form-label-premium">Room ID</label>
              <input
                type="text"
                className="form-control-premium"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Paste Room ID here..."
                required
              />
            </div>

            <button type="submit" className="btn-premium w-100 mt-4" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}>
              <FiLogIn /> Join Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinCreateRoom;
