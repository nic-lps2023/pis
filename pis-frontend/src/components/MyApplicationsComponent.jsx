import React, { useEffect, useState } from "react";
import { getUserId } from "../services/AuthService";
import {
  getApplicationsByUserId,
  downloadGeneratedPermit,
  downloadApplicationDocument,
} from "../services/PermitApplicationService";

const MyApplicationsComponent = () => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);

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

  const openDetailsModal = (application) => {
    setSelectedApplication(application);
  };

  const closeDetailsModal = () => {
    setSelectedApplication(null);
  };

  const handleViewOrDownloadDocument = (applicationId, documentFileName) => {
    downloadApplicationDocument(applicationId)
      .then((response) => {
        const contentType = response.headers["content-type"] || "application/pdf";
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);

        const viewableTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif"];
        const isViewable = viewableTypes.some((type) => contentType.includes(type));

        if (isViewable) {
          window.open(url, "_blank");
          setTimeout(() => window.URL.revokeObjectURL(url), 5000);
          return;
        }

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", documentFileName || `application_${applicationId}_document`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Error downloading/viewing document:", error);
        alert("Document could not be opened. Please try again.");
      });
  };

  const formatDateTimeForList = (value) => {
    if (!value) return "N/A";

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;

    const day = String(parsedDate.getDate()).padStart(2, "0");
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const year = parsedDate.getFullYear();

    let hours = parsedDate.getHours();
    const minutes = String(parsedDate.getMinutes()).padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${day}/${month}/${year}, ${String(hours).padStart(2, "0")}:${minutes} ${period}`;
  };

  const formatDateTime = (value) => {
    if (!value) return "N/A";

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return value;

    return parsedDate.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getSubmissionDate = (application) =>
    application?.submissionDate ||
    application?.applicationDate ||
    application?.createdAt ||
    application?.createdDate ||
    application?.submittedAt ||
    application?.submissionAt ||
    null;

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
            <th>View Application Details</th>
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
              <td>{formatDateTimeForList(app.startDateTime)}</td>
              <td>{formatDateTimeForList(app.endDateTime)}</td>
              <td>
                <button
                  className="btn btn-sm btn-info"
                  onClick={() => openDetailsModal(app)}
                >
                  View Details
                </button>
              </td>
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

      {selectedApplication && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Application Details - #{selectedApplication.applicationId}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeDetailsModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <p><b>Event Title:</b> {selectedApplication.eventTitle || "N/A"}</p>
                    <p><b>Permit Type:</b> {selectedApplication.permitType || "N/A"}</p>
                    <p><b>Submission/Application Date:</b> {formatDateTime(getSubmissionDate(selectedApplication))}</p>
                    <p><b>Purpose:</b> {selectedApplication.purpose || "N/A"}</p>
                    <p><b>Start Date:</b> {formatDateTime(selectedApplication.startDateTime)}</p>
                    <p><b>End Date:</b> {formatDateTime(selectedApplication.endDateTime)}</p>
                  </div>
                  <div className="col-md-6">
                    <p><b>Venue:</b> {selectedApplication.venueName || "N/A"}</p>
                    <p><b>Locality:</b> {selectedApplication.locality || "N/A"}</p>
                    <p><b>Landmark:</b> {selectedApplication.landmark || "N/A"}</p>
                    <p><b>Pincode:</b> {selectedApplication.pincode || "N/A"}</p>
                    <p><b>Full Address:</b> {selectedApplication.fullAddress || "N/A"}</p>
                  </div>
                </div>

                <hr />

                <div className="row">
                  <div className="col-md-6">
                    <p><b>District:</b> {selectedApplication.districtName || "N/A"}</p>
                    <p><b>Subdivision:</b> {selectedApplication.subdivisionName || "N/A"}</p>
                    <p><b>Police Station:</b> {selectedApplication.policeStationName || "N/A"}</p>
                  </div>
                  <div className="col-md-6">
                    <p><b>Status:</b> {selectedApplication.status || "N/A"}</p>
                    <p>
                      <b>Document:</b> {selectedApplication.documentFileName || "N/A"}
                      {selectedApplication.documentFileName && (
                        <button
                          className="btn btn-sm btn-outline-primary ms-2"
                          onClick={() =>
                            handleViewOrDownloadDocument(
                              selectedApplication.applicationId,
                              selectedApplication.documentFileName
                            )
                          }
                        >
                          View/Download
                        </button>
                      )}
                    </p>
                    <p><b>Permit File:</b> {selectedApplication.permitFileName || "N/A"}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeDetailsModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyApplicationsComponent;
