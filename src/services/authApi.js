// src/services/authApi.js
import axios from "axios";


const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_AUTH_API_BASE_URL) ||
  "https://sistemas.huwc.ufc.br/auth/";


const authApi = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: false,
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
  },
});

authApi.interceptors.request.use((config) => {
  if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }
  return config;
});

authApi.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(err);
  }
);

export default authApi;
