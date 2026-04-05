import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "safeai_token";
const EMAIL_KEY = "safeai_email";

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Token refresh queue to handle concurrent 401s
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeToTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const notifyTokenRefresh = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses - attempt refresh or logout
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error?.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        // No refresh token - logout immediately
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EMAIL_KEY);
        localStorage.removeItem('refresh_token');
        window.location.reload();
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;

        return client
          .post("/auth/refresh", { refresh_token: refreshToken })
          .then((response) => {
            const { access_token } = response.data;
            localStorage.setItem(TOKEN_KEY, access_token);
            client.defaults.headers.Authorization = `Bearer ${access_token}`;
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            
            isRefreshing = false;
            notifyTokenRefresh(access_token);
            return client(originalRequest);
          })
          .catch((refreshError) => {
            // Refresh failed - logout
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(EMAIL_KEY);
            localStorage.removeItem('refresh_token');
            isRefreshing = false;
            refreshSubscribers = [];
            window.location.reload();
            return Promise.reject(refreshError);
          });
      } else {
        // Refresh is already happening - queue this request
        return new Promise((resolve) => {
          subscribeToTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(client(originalRequest));
          });
        });
      }
    }

    return Promise.reject(error);
  }
);

function handleError(error) {
  const detail = error?.response?.data?.detail;
  const message = typeof detail === "string" ? detail : error?.message || "Request failed";
  console.error("API Error:", {
    status: error?.response?.status,
    data: error?.response?.data,
    message: message,
    url: error?.config?.url,
  });
  throw new Error(message);
}

export function signup(email, password) {
  return client
    .post("/auth/register", { email, password })
    .then((response) => {
      const { access_token, refresh_token, user } = response.data;
      if (access_token) {
        localStorage.setItem(TOKEN_KEY, access_token);
      }
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      if (user && user.email) {
        localStorage.setItem(EMAIL_KEY, user.email);
      }
      return response.data;
    })
    .catch(handleError);
}

export function login(email, password) {
  return client
    .post("/auth/login", { email, password })
    .then((response) => {
      const { access_token, refresh_token, user } = response.data;
      if (access_token) {
        localStorage.setItem(TOKEN_KEY, access_token);
      }
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      if (user && user.email) {
        localStorage.setItem(EMAIL_KEY, user.email);
      }
      return response.data;
    })
    .catch(handleError);
}

export function logout() {
  // Revoke refresh token on backend
  const refreshToken = localStorage.getItem('refresh_token');
  if (refreshToken) {
    client
      .post("/auth/logout", { refresh_token: refreshToken })
      .catch(() => {
        // Ignore errors - we're logging out anyway
      });
  }
  
  // Clear local storage
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
  localStorage.removeItem('refresh_token');
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

export function getGreeting() {
  return client
    .get("/chat/greeting")
    .then((response) => response.data)
    .catch(handleError);
}

export function validateSession() {
  return client
    .get("/auth/validate-session")
    .then((response) => response.data)
    .catch(handleError);
}

export function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  
  return client
    .post("/auth/refresh", { refresh_token: refreshToken })
    .then((response) => {
      if (response.data.access_token) {
        localStorage.setItem(TOKEN_KEY, response.data.access_token);
      }
      return response.data;
    })
    .catch(handleError);
}

export function submitJournal(text) {
  console.log("💾 Submitting journal entry...");
  return client
    .post("/journal", { text })
    .then((response) => {
      console.log("✅ Journal entry created:", response.data);
      return response.data;
    })
    .catch(handleError);
}

export function getJournalHistory() {
  console.log("📖 Fetching journal history from API...");
  return client
    .get("/journal")
    .then((response) => {
      console.log("✅ Journal history loaded:", response.data);
      return response.data;
    })
    .catch(handleError);
}

export function updateJournal(entryId, text) {
  return client
    .put(`/journal/${entryId}`, { text })
    .then((response) => response.data)
    .catch(handleError);
}

export function deleteJournal(entryId) {
  return client
    .delete(`/journal/${entryId}`)
    .then(() => ({ success: true }))
    .catch(handleError);
}

export function getMoodData() {
  return client
    .get("/mood")
    .then((response) => response.data)
    .catch(handleError);
}
