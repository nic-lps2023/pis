import axios from "./axiosConfig";

const REST_API_BASE_URL = "http://localhost:8080/api/users";
const ROLE_API_BASE_URL = "http://localhost:8080/api/roles";

export const listUsers = () => axios.get(REST_API_BASE_URL);

export const createUser = (user) => axios.post(REST_API_BASE_URL, user);

export const getUser = (userId) => axios.get(`${REST_API_BASE_URL}/${userId}`);

export const updateUser = (userId, user) =>
  axios.put(`${REST_API_BASE_URL}/${userId}`, user);

export const deleteUser = (userId) =>
  axios.delete(`${REST_API_BASE_URL}/${userId}`);

export const listRoles = () => axios.get(ROLE_API_BASE_URL);

export const checkEmailExists = (email, userId = 0) =>
  axios.get(`${REST_API_BASE_URL}/check-email`, {
    params: { email, userId },
  });

export const checkPhoneExists = (phoneNumber, userId = 0) =>
  axios.get(`${REST_API_BASE_URL}/check-phone`, {
    params: { phoneNumber, userId },
  });
