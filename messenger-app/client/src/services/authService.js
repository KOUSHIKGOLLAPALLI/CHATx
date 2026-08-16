import api from "./api";

export const registerUser = payload => api.post("/auth/register", payload);
export const verifyAccount = payload => api.post("/auth/verify", payload);
