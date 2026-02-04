import axios from "axios";
import { useAuthStore } from "@/Store/authStore";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://annecreation.reesanit.com';



const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Client-Source": "web",
  },
});

// ===============================
// Token refresh queue
// ===============================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
};

// ===============================
// Request interceptor
// ===============================
axiosClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===============================
// Response interceptor
// ===============================
axiosClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const { logout, setAccessToken, refreshToken } =
      useAuthStore.getState();

    if (
      originalRequest.url.includes("logout") ||
      originalRequest.url.includes("refresh-token")
    ) {
      logout();
      window.location.href = "/Auth/Login";
      return Promise.reject(error);
    }

    if (
      (error.response?.status === 401 ||
        error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axiosClient.post(
          "/api/customers/refresh-token",
          { refreshToken },
          { withCredentials: true }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        if (!newAccessToken) {
          processQueue(new Error("No new token"));
          logout();
          window.location.href = "/Auth/Login";
          return Promise.reject(error);
        }

        setAccessToken(newAccessToken);

        if (newRefreshToken) {
          useAuthStore.getState().setRefreshToken(newRefreshToken);
        }

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);
      } catch (err) {
        processQueue(err);
        logout();
        window.location.href = "/Auth/Login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
