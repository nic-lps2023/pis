import React, { useEffect, useState } from "react";
import { getUserId } from "../services/AuthService";
import {
  getApplicationsByUserId,
  downloadGeneratedPermit,
} from "../services/PermitApplicationService";

const MyApplicationsComponent = () => {
  const [applications, setApplications] = useState([]);

  const userId = getUserId();

  useEffect(() => {
    if (!userId) {
      alert("User not logged in!");
      return;
    }

    getApplicationsByUserId(userId)
      .then((response) => {
        setApplications(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [userId]);

  const handleDownloadPermit = (applicationId, permitFileName) => {
    downloadGeneratedPermit(applicationId)
      .then((response) => {
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", permitFileName || `permit_${applicationId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Error downloading permit:", error);
        alert("Permit download failed. Please try again.");
      });
  };

  return (
    <div className="container">
      <h2 className="text-center">My Permit Applications</h2>

      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Application ID</th>
            <th>Event Title</th>
            <th>Permit Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {applications.map((app) => (
            <tr key={app.applicationId}>
              <td>{app.applicationId}</td>
              <td>{app.eventTitle}</td>
              <td>{app.permitType}</td>
              <td>{app.startDateTime}</td>
              <td>{app.endDateTime}</td>
              <td>
                <b>{app.status}</b>
                {app.status === "REJECTED" && app.dcRemarks && (
                  <div className="text-danger mt-1">
                    <small><b>Reason:</b> {app.dcRemarks}</small>
                  </div>
                )}
              </td>
              <td>
                {app.status === "APPROVED" && (
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleDownloadPermit(app.applicationId, app.permitFileName)}
                  >
                    Download Permit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-center mt-3">
        <a className="btn btn-success" href="/permit-application">
          Apply New Permit
        </a>
      </div>
    </div>
  );
};

export default MyApplicationsComponent;
