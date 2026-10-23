import { createAuthClient } from "../auth";
const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
export const auth = createAuthClient(BASE_URL, fetch, `${import.meta.env.BASE_URL}?login=success`);
