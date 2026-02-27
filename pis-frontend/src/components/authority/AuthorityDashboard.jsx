import React from "react";
import { Link } from "react-router-dom";

const AuthorityDashboard = () => {
  const roleName = localStorage.getItem("roleName");

  return (
    <div className="container mt-4">
      <h2 className="text-center">Authority Dashboard</h2>
      <h5 className="text-center text-primary">Role: {roleName}</h5>

      <div className="card p-3 mt-4">
        <h4>Quick Links</h4>

        <ul>
          <li><Link to="/authority/inbox">Inbox Applications</Link></li>
          <li><Link to="/authority/approved">Approved Applications</Link></li>
          <li><Link to="/authority/rejected">Rejected Applications</Link></li>
        </ul>
      </div>
    </div>
  );
};

export default AuthorityDashboard;
