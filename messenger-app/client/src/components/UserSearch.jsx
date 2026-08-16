import { useState } from "react";
import { searchUsers } from "../services/userService";
import { sendChatRequest } from "../services/chatService";

export default function UserSearch() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  async function search(event) {
    const value = event.target.value;
    setQuery(value);

    if (value.trim().length < 2) {
      setUsers([]);
      return;
    }

    try {
      const { data } = await searchUsers(value);
      setUsers(data.users);
    } catch (error) {
      setMessage(error.response?.data?.message || "Search failed");
    }
  }

  async function request(userId) {
    try {
      await sendChatRequest(userId);
      setMessage("Chat request sent");
    } catch (error) {
      setMessage(error.response?.data?.message || "Request failed");
    }
  }

  return (
    <div className="search-panel">
      <input
        value={query}
        onChange={search}
        placeholder="Search username or email..."
      />

      {message && <small className="muted">{message}</small>}

      {users.map(user => (
        <div className="search-result" key={user._id}>
          <div>
            <strong>{user.username}</strong>
            <small>{user.email}</small>
          </div>
          <button onClick={() => request(user._id)}>Chat</button>
        </div>
      ))}
    </div>
  );
}
