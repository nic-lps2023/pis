import axios from "axios";

const AUTH_API_BASE_URL = "http://localhost:8080/api/auth";

export const loginUser = (userId, password) => {
  return axios.post(`${AUTH_API_BASE_URL}/login`, {
    userId,
    password,
  });
};

export const logout = () => {
  localStorage.clear();
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const getUserId = () => {
  return localStorage.getItem("userId");
};

export const getFullName = () => {
  return localStorage.getItem("fullName");
};

export const getEmail = () => {
  return localStorage.getItem("email");
};

export const getPhoneNumber = () => {
  return localStorage.getItem("phoneNumber");
};

export const getRoleId = () => {
  return localStorage.getItem("roleId");
};

export const getRoleName = () => {
  return localStorage.getItem("roleName");
};

export const isLoggedIn = () => {
  return localStorage.getItem("token") != null;
};

export const getCurrentUser = () => {
  return {
    token: localStorage.getItem("token"),
    userId: localStorage.getItem("userId"),
    fullName: localStorage.getItem("fullName"),
    email: localStorage.getItem("email"),
    phoneNumber: localStorage.getItem("phoneNumber"),
    roleId: localStorage.getItem("roleId"),
    roleName: localStorage.getItem("roleName"),
  };
};
