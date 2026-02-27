import axios from "./axiosConfig";

const PERMIT_API_BASE_URL = "/api/permit-applications";

/**
 * Create Permit Application without PDF
 */
export const createApplication = (applicationDto) =>
  axios.post(PERMIT_API_BASE_URL, applicationDto);

/**
 * Create Permit Application with PDF upload
 */
export const createPermitApplicationWithPdf = (applicationDto, file) => {
  const formData = new FormData();

  // IMPORTANT: must match backend @RequestPart("application")
  formData.append(
    "application",
    new Blob([JSON.stringify(applicationDto)], { type: "application/json" })
  );

  // IMPORTANT: must match backend @RequestPart("file")
  formData.append("file", file);

  return axios.post(`${PERMIT_API_BASE_URL}/with-pdf`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

/**
 * Get applications by user id
 */
export const getApplicationsByUserId = (userId) =>
  axios.get(`${PERMIT_API_BASE_URL}/user/${userId}`);

/**
 * Get all applications
 */
export const getAllApplications = () =>
  axios.get(PERMIT_API_BASE_URL);

/**
 * Get application by id
 */
export const getApplicationById = (id) =>
  axios.get(`${PERMIT_API_BASE_URL}/${id}`);

/**
 * Update application
 */
export const updateApplication = (id, applicationDto) =>
  axios.put(`${PERMIT_API_BASE_URL}/${id}`, applicationDto);

/**
 * Delete application
 */
export const deleteApplication = (id) =>
  axios.delete(`${PERMIT_API_BASE_URL}/${id}`);
