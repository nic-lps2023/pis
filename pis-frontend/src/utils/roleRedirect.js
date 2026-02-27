/**
 * Utility function to determine redirect path based on user role
 * 
 * Role Mapping:
 * - 1: ADMIN
 * - 2: DC
 * - 3: SP
 * - 4: SDPO
 * - 5: OC
 * - 6: AUTHORITY
 * - 7: APPLICANT
 */

export const getRedirectPathByRole = (roleId) => {
  const authorityRoles = ["2", "3", "4", "5", "6"]; // DC, SP, SDPO, OC, AUTHORITY
  const applicantRole = "7"; // APPLICANT
  const adminRole = "1"; // ADMIN

  if (roleId.toString() === "2") {
    return "/authority/dc-dashboard";
  } else if (roleId.toString() === "3") {
    return "/authority/sp-dashboard";
  } else if (roleId.toString() === "4") {
    return "/authority/sdpo-dashboard";
  } else if (authorityRoles.includes(roleId.toString())) {
    return "/authority-dashboard";
  } else if (roleId.toString() === applicantRole) {
    return "/my-applications"; // Applicant Dashboard - shows previous applications and new permit button
  } else if (roleId.toString() === adminRole) {
    return "/users";
  }

  // Default fallback
  return "/my-applications";
};

export const isAuthorityRole = (roleId) => {
  return ["2", "3", "4", "5", "6"].includes(roleId.toString());
};

export const isApplicantRole = (roleId) => {
  return roleId.toString() === "7";
};

export const isAdminRole = (roleId) => {
  return roleId.toString() === "1";
};
