import axios from "axios";

const instance = axios.create();

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const roleId = localStorage.getItem("roleId");

    if (token) {
      config.headers.Authorization = "Bearer " + token;
    }

    if (userId) {
      config.headers["X-User-Id"] = userId;
    }

    if (roleId) {
      config.headers["X-Role-Id"] = roleId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
