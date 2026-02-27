import axios from "./axiosConfig";

const AUTHORITY_API_BASE_URL = "/api/authority";
const PERMIT_API_BASE_URL = "/api/permit-applications";

/**
 * Get inbox applications by stage
 * Stages: DC_PENDING, SP_PENDING, SDPO_PENDING, OC_PENDING, SDPO_REVIEW_PENDING, SP_REVIEW_PENDING, DC_FINAL_PENDING
 */
export const getInboxByStage = (stage) =>
  axios.get(`${AUTHORITY_API_BASE_URL}/inbox/${stage}`, {
    headers: {
      "X-Role-Id": localStorage.getItem("roleId") || "",
    },
  });

/**
 * Get application by ID
 */
export const getApplicationById = (id) =>
  axios.get(`${PERMIT_API_BASE_URL}/${id}`);

/**
 * DC forward to SP
 */
export const forwardToSP = (id, remarks) =>
  axios.put(`${AUTHORITY_API_BASE_URL}/dc/forward-sp/${id}`, { remarks });

/**
 * SP forward to SDPO
 */
export const forwardToSDPO = (id, remarks) =>
  axios.put(`${AUTHORITY_API_BASE_URL}/sp/forward-sdpo/${id}`, { remarks });

/**
 * SDPO forward to OC
 */
export const forwardToOC = (id, remarks) =>
  axios.put(`${AUTHORITY_API_BASE_URL}/sdpo/forward-oc/${id}`, { remarks });

/**
 * OC submit report
 */
export const submitOCReport = (id, report) =>
  axios.put(`${AUTHORITY_API_BASE_URL}/oc/report/${id}`, { report });

/**
 * SDPO forward to SP after OC report
 */
export const forwardToSPFromSDPO = (id, remarks) =>
  axios.put(`${AUTHORITY_API_BASE_URL}/sdpo/forward-sp/${id}`, { remarks });

/**
 * SP recommend to DC
 */
export const recommendToDC = (id, remarks) =>
  axios.put(`${AUTHORITY_API_BASE_URL}/sp/recommend-dc/${id}`, { remarks });

/**
 * DC approve application
 */
export const approveByDC = (id, remarks) =>
  axios.put(`${AUTHORITY_API_BASE_URL}/dc/approve/${id}`, { remarks });

/**
 * DC reject application
 */
export const rejectByDC = (id, remarks) =>
  axios.put(`${AUTHORITY_API_BASE_URL}/dc/reject/${id}`, { remarks });

/**
 * Download applicant's uploaded document
 */
export const downloadDocument = (applicationId) =>
  axios.get(`${PERMIT_API_BASE_URL}/${applicationId}/download-document`, {
    responseType: "blob",
  });

/**
 * View document inline (in browser)
 */
export const viewDocument = (applicationId) =>
  axios.get(`${PERMIT_API_BASE_URL}/${applicationId}/view-document`, {
    responseType: "blob",
  });
