import React, { useEffect, useState } from "react";
import { getInboxByStage, downloadDocument } from "../../services/AuthorityService";
import { useNavigate } from "react-router-dom";

const DCDashboard = () => {
  const [applications, setApplications] = useState({ pending: [], review: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const navigate = useNavigate();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    setLoading(true);
    setError(null);

    Promise.all([
      getInboxByStage("DC_PENDING"),
      getInboxByStage("DC_FINAL_PENDING"),
    ])
      .then(([pendingRes, reviewRes]) => {
        console.log("DC_PENDING:", pendingRes.data);
        console.log("DC_FINAL_PENDING:", reviewRes.data);
        setApplications({
          pending: pendingRes.data || [],
          review: reviewRes.data || [],
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

  const handleDownloadDocument = (applicationId, fileName) => {
    downloadDocument(applicationId)
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName || "document.pdf");
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      })
      .catch((err) => {
        console.error("Error downloading document:", err);
        alert("Failed to download document. Please try again.");
      });
  };

  const currentList =
    activeTab === "pending" ? applications.pending || [] : applications.review || [];

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
                </td>
                <td>{app.locationTag}</td>
                <td>
                  {app.documentFileName ? (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        handleDownloadDocument(
                          app.applicationId,
                          app.documentFileName
                        )
                      }
                      title="Download application document"
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
