import axios from "./axiosConfig";

const DISTRICT_API_BASE_URL = "/api/districts";
const SUBDIVISION_API_BASE_URL = "/api/subdivisions";
const POLICE_STATION_API_BASE_URL = "/api/police-stations";

export const getAllDistricts = () => axios.get(DISTRICT_API_BASE_URL);

export const getSubdivisionsByDistrictId = (districtId) =>
  axios.get(`${SUBDIVISION_API_BASE_URL}?districtId=${districtId}`);

export const getPoliceStationsBySubdivisionId = (subdivisionId) =>
  axios.get(`${POLICE_STATION_API_BASE_URL}?subdivisionId=${subdivisionId}`);
