import { useEffect, useState } from "react";
import {
  acceptRequest,
  getReceivedRequests,
  rejectRequest
} from "../services/chatService";

export default function ChatRequest({ onAccepted }) {
  const [requests, setRequests] = useState([]);

  async function load() {
    try {
      const { data } = await getReceivedRequests();
      setRequests(data.requests);
    } catch {
      setRequests([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function accept(id) {
    await acceptRequest(id);
    await load();
    onAccepted?.();
  }

  async function reject(id) {
    await rejectRequest(id);
    await load();
  }

  if (!requests.length) return null;

  return (
    <div className="requests">
      <h3>Chat requests</h3>

      {requests.map(request => (
        <div className="request-item" key={request._id}>
          <span>{request.sender.username}</span>
          <div>
            <button onClick={() => accept(request._id)}>Accept</button>
            <button className="secondary" onClick={() => reject(request._id)}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
