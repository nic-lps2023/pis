import React, { useEffect, useState } from "react";
import { getInboxByStage, viewDocument } from "../../services/AuthorityService";
import { getAllApplications } from "../../services/PermitApplicationService";
import { useNavigate } from "react-router-dom";

const DCDashboard = () => {
  const [applications, setApplications] = useState({
    pending: [],
    review: [],
    approved: [],
    rejected: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const navigate = useNavigate();

  const getLocationText = (app) =>
    app.fullAddress ||
    [app.venueName, app.locality, app.pincode].filter(Boolean).join(", ") ||
    "N/A";

  const byStatus = (list, status) =>
    (list || []).filter(
      (item) => (item.status || "").toUpperCase() === status.toUpperCase()
    );

  const sortByApplicationIdDesc = (list) =>
    [...(list || [])].sort((a, b) => {
      const aId = Number(a?.applicationId);
      const bId = Number(b?.applicationId);

      if (Number.isNaN(aId) || Number.isNaN(bId)) {
        return String(b?.applicationId || "").localeCompare(
          String(a?.applicationId || ""),
          undefined,
          { numeric: true, sensitivity: "base" }
        );
      }

      return bId - aId;
    });

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    setLoading(true);
    setError(null);

    Promise.all([
      getInboxByStage("DC_PENDING"),
      getInboxByStage("DC_FINAL_PENDING"),
      getAllApplications(),
    ])
      .then(([pendingRes, reviewRes, allRes]) => {
        console.log("DC_PENDING:", pendingRes.data);
        console.log("DC_FINAL_PENDING:", reviewRes.data);
        const allApplications = allRes.data || [];
        setApplications({
          pending: pendingRes.data || [],
          review: reviewRes.data || [],
          approved: sortByApplicationIdDesc(byStatus(allApplications, "APPROVED")),
          rejected: sortByApplicationIdDesc(byStatus(allApplications, "REJECTED")),
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading applications:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to load applications";
        setError(errorMessage);
        setLoading(false);
      });
  };

  const handleViewDocument = (applicationId) => {
    viewDocument(applicationId)
      .then((response) => {
        const contentType = response.headers?.["content-type"] || "application/pdf";
        if (!contentType.toLowerCase().includes("pdf")) {
          alert("Unable to open document. The server did not return a PDF file.");
          return;
        }

        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: "application/pdf" })
        );
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => window.URL.revokeObjectURL(url), 2000);
      })
      .catch((err) => {
        console.error("Error opening document:", err);
        alert("Failed to open document. Please try again.");
      });
  };

  const currentList = applications[activeTab] || [];

  if (loading) return <p className="text-center mt-4">Loading...</p>;

  return (
    <div className="container mt-4">
      <h2 className="text-center">Deputy Commissioner (DC) Dashboard</h2>
      <p className="text-center text-muted">Manage initial and final stage reviews</p>

      {error && <div className="alert alert-danger">{error}</div>}

      <ul className="nav nav-tabs mt-4" role="tablist">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            📋 Pending ({applications.pending?.length || 0})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "review" ? "active" : ""}`}
            onClick={() => setActiveTab("review")}
          >
            🔍 For Review ({applications.review?.length || 0})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            ✅ Approved Applications ({applications.approved?.length || 0})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "rejected" ? "active" : ""}`}
            onClick={() => setActiveTab("rejected")}
          >
            ❌ Rejected Applications ({applications.rejected?.length || 0})
          </button>
        </li>
      </ul>

      {currentList.length === 0 && !error && (
        <p className="text-center mt-4 text-muted">No applications to display</p>
      )}

      {currentList.length > 0 && (
        <table className="table table-bordered table-striped mt-3">
          <thead>
            <tr>
              <th>ID</th>
              <th>Event Title</th>
              <th>Permit Type</th>
              <th>Status</th>
              <th>Location</th>
              <th>Document</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentList.map((app) => (
              <tr key={app.applicationId}>
                <td>{app.applicationId}</td>
                <td>{app.eventTitle}</td>
                <td>{app.permitType}</td>
                <td>
                  <span className="badge bg-info">{app.status}</span>
                  {app.permitPath && (
                    <span className="badge bg-success ms-2">Permit Available</span>
                  )}
                  {!app.permitPath && app.status === "APPROVED" && (
                    <span className="badge bg-warning text-dark ms-2">Permit Missing</span>
                  )}
                </td>
                <td>{getLocationText(app)}</td>
                <td>
                  {app.documentFileName ? (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleViewDocument(app.applicationId)}
                      title="Open application document in new tab"
                    >
                      📄
                    </button>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-info"
                    onClick={() =>
                      navigate(`/authority/application/${app.applicationId}`, {
                        state: { from: "/authority/dc-dashboard", tab: activeTab },
                      })
                    }
                    title="View full details"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}


    </div>
  );
};

export default DCDashboard;
