import api from "./api";

export const searchUsers = q => api.get(`/users/search?q=${encodeURIComponent(q)}`);
export const blockUser = id => api.post(`/users/${id}/block`);
export const unblockUser = id => api.post(`/users/${id}/unblock`);
