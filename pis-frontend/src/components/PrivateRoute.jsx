import React from "react";
import { Navigate } from "react-router-dom";
import { isLoggedIn, getRoleId } from "../services/AuthService";

const PrivateRoute = ({ children, allowedRoles = null }) => {
  if (!isLoggedIn()) {
    return <Navigate to="/login" />;
  }

  // If allowedRoles is specified, check if user has permission
  if (allowedRoles !== null) {
    const userRoleId = getRoleId();
    const hasPermission = allowedRoles.includes(parseInt(userRoleId));

    if (!hasPermission) {
      // Redirect to a user's default dashboard based on their role
      return <Navigate to="/" />;
    }
  }

  return children;
};

export default PrivateRoute;
