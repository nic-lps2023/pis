import React from "react";
import { useNavigate } from "react-router-dom";
import { logout, isLoggedIn } from "../services/AuthService";

const HeaderComponent = () => {
  const navigator = useNavigate();

  const logoutUser = () => {
    logout();
    navigator("/login");
  };

  return (
    <div>
      <header>
        <nav className="navbar navbar-dark bg-dark px-3">
          <a className="navbar-brand" href="/">
            Permit Issuance System
          </a>

          {isLoggedIn() && (
            <button className="btn btn-danger" onClick={logoutUser}>
              Logout
            </button>
          )}
        </nav>
      </header>
    </div>
  );
};

export default HeaderComponent;
