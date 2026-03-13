import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout, isLoggedIn, getFullName, getUserId } from "../services/AuthService";

const HeaderComponent = () => {
  const navigator = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
    navigator("/login");
  };

  const openLogoutModal = () => setShowLogoutModal(true);
  const closeLogoutModal = () => setShowLogoutModal(false);

  useEffect(() => {
    if (!showLogoutModal) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeLogoutModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showLogoutModal]);

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
              <button className="btn btn-danger" onClick={openLogoutModal}>
                Logout
              </button>
            </div>
          )}
        </nav>
      </header>

      {showLogoutModal && (
        <div
          className="modal d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeLogoutModal();
            }
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-body">
                <h5 className="fw-bold mb-2">Permit Issuance System</h5>
                <hr className="my-2" />
                <p className="mb-0">Are you sure you want to logout from this session?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeLogoutModal}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={confirmLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderComponent;
