import api from "./api";

export const sendMessage = payload =>
  api.post("/messages", payload);
