import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Add interceptor to automatically attach JWT token if available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken"); // adjust if you store it elsewhere
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const generateResume = async (description) => {
  const response = await axiosInstance.post("/api/resume/generate", {
    userDescription: description,
  });

  return response.data;
};
