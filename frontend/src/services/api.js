import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "safeai_token";
const EMAIL_KEY = "safeai_email";

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function handleError(error) {
  const detail = error?.response?.data?.detail;
  throw new Error(typeof detail === "string" ? detail : "Request failed");
}

export function signup(email, password) {
  return client
    .post("/auth/signup", { email, password })
    .then((response) => {
      const { access_token, email: userEmail } = response.data;
      if (access_token) {
        localStorage.setItem(TOKEN_KEY, access_token);
      }
      if (userEmail) {
        localStorage.setItem(EMAIL_KEY, userEmail);
      }
      return response.data;
    })
    .catch(handleError);
}

export function login(email, password) {
  return client
    .post("/auth/login", { email, password })
    .then((response) => {
      const { access_token, email: userEmail } = response.data;
      if (access_token) {
        localStorage.setItem(TOKEN_KEY, access_token);
      }
      if (userEmail) {
        localStorage.setItem(EMAIL_KEY, userEmail);
      }
      return response.data;
    })
    .catch(handleError);
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

export function getAuthenticatedEmail() {
  return localStorage.getItem(EMAIL_KEY) || "";
}

export function sendChatMessage(message) {
  return client
    .post("/chat", { message })
    .then((response) => response.data)
    .catch(handleError);
}

export function getChatHistory() {
  return client
    .get("/chat/history")
    .then((response) => response.data)
    .catch(handleError);
}

export function submitJournal(text) {
  return client
    .post("/journal", { text })
    .then((response) => response.data)
    .catch(handleError);
}

export function getMoodData() {
  return client
    .get("/mood")
    .then((response) => response.data)
    .catch(handleError);
}
