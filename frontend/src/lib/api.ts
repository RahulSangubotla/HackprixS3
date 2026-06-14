import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers["Authorization"] = "Bearer " + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refreshing
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const response = await axios.post("http://127.0.0.1:8000/api/auth/refresh/", {
            refresh: refreshToken,
          });
          const newAccessToken = response.data.access;
          localStorage.setItem("access_token", newAccessToken);
          api.defaults.headers.common["Authorization"] = "Bearer " + newAccessToken;
          originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
          return api(originalRequest);
        } catch (refreshError) {
          // Handle refresh token failure (e.g., logout user)
          console.error("Token refresh failed", refreshError);
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          // Optionally redirect to login
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
