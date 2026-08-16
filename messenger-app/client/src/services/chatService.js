import api from "./api";

export const sendChatRequest = (receiverId) =>
  api.post("/requests", {
    receiverId
  });

export const getReceivedRequests = () =>
  api.get("/requests/received");

export const acceptRequest = (id) =>
  api.put(`/requests/${id}/accept`);

export const rejectRequest = (id) =>
  api.put(`/requests/${id}/reject`);

export const getConversations = () =>
  api.get("/conversations");

export const getMessages = (id) =>
  api.get(`/conversations/${id}/messages`);

export const sendMessage = (
  conversationId,
  content
) =>
  api.post(
    `/conversations/${conversationId}/messages`,
    {
      content
    }
  );