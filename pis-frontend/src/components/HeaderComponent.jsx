import React from "react";
import { useNavigate } from "react-router-dom";
import { logout, isLoggedIn, getFullName, getUserId } from "../services/AuthService";

const HeaderComponent = () => {
  const navigator = useNavigate();

  const logoutUser = () => {
    logout();
    navigator("/login");
  };

  const openMyProfile = () => {
    const currentUserId = getUserId();
    if (currentUserId) {
      navigator(`/edit-register-user/${currentUserId}`);
    }
  };

  return (
    <div>
      <header>
        <nav className="navbar navbar-dark bg-dark px-3">
          <a className="navbar-brand" href="/">
            Permit Issuance System
          </a>

          {isLoggedIn() && (
            <div className="d-flex align-items-center gap-2">
              <span className="text-light">{getFullName() || "Account"}</span>
              <button className="btn btn-outline-light" onClick={openMyProfile}>
                My Profile
              </button>
              <button className="btn btn-danger" onClick={logoutUser}>
                Logout
              </button>
            </div>
          )}
        </nav>
      </header>
    </div>
  );
};

export default HeaderComponent;
