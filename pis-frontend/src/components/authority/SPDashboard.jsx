import React, { useEffect, useState } from "react";
import { getInboxByStage, forwardToSDPO, recommendToDC, downloadDocument } from "../../services/AuthorityService";
import { useNavigate } from "react-router-dom";

const SPDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [actionRemarks, setActionRemarks] = useState("");
  const [actionType, setActionType] = useState(""); // "forward" or "recommend"
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "review"
  const navigate = useNavigate();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    setLoading(true);
    setError(null);

    // Load both SP_PENDING and SP_REVIEW_PENDING
    Promise.all([
      getInboxByStage("SP_PENDING"),
      getInboxByStage("SP_REVIEW_PENDING"),
    ])
      .then(([res1, res2]) => {
        console.log("SP_PENDING:", res1.data);
        console.log("SP_REVIEW_PENDING:", res2.data);
        setApplications({
          pending: res1.data || [],
          review: res2.data || [],
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

  /**
   * Forward to SDPO
   */
  const handleForwardToSDPO = () => {
    if (!actionRemarks.trim()) {
      alert("Please enter remarks before forwarding");
      return;
    }

    setProcessing(true);
    forwardToSDPO(selectedAppId, actionRemarks)
      .then((res) => {
        console.log("Application forwarded to SDPO:", res.data);
        alert("Application forwarded to SDPO successfully!");
        setShowActionModal(false);
        setActionRemarks("");
        setSelectedAppId(null);
        loadApplications();
      })
      .catch((err) => {
        console.error("Error forwarding application:", err);
        alert(
          err.response?.data?.message ||
            "Failed to forward application. Please try again."
        );
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  /**
   * Recommend to DC
   */
  const handleRecommendToDC = () => {
    if (!actionRemarks.trim()) {
      alert("Please enter your recommendation");
      return;
    }

    setProcessing(true);
    recommendToDC(selectedAppId, actionRemarks)
      .then((res) => {
        console.log("Application recommended to DC:", res.data);
        alert("Application recommendation sent to DC successfully!");
        setShowActionModal(false);
        setActionRemarks("");
        setSelectedAppId(null);
        loadApplications();
      })
      .catch((err) => {
        console.error("Error sending recommendation:", err);
        alert(
          err.response?.data?.message ||
            "Failed to send recommendation. Please try again."
        );
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  /**
   * Handle document download
   */
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

  /**
   * Open action modal
   */
  const openActionModal = (appId, type) => {
    setSelectedAppId(appId);
    setActionType(type);
    setActionRemarks("");
    setShowActionModal(true);
  };

  /**
   * Close action modal
   */
  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedAppId(null);
    setActionRemarks("");
    setActionType("");
  };

  if (loading) return <p className="text-center mt-4">Loading...</p>;

  const currentList = activeTab === "pending" ? applications.pending || [] : applications.review || [];

  return (
    <div className="container mt-4">
      <h2 className="text-center">State Police (SP) Dashboard</h2>
      <p className="text-center text-muted">Manage permit applications</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabs */}
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
                  <div className="btn-group btn-group-sm" role="group">
                    <button
                      className="btn btn-info"
                      onClick={() =>
                        navigate(`/authority/application/${app.applicationId}`, {
                          state: { from: "/authority/sp-dashboard", tab: activeTab },
                        })
                      }
                      title="View full details"
                    >
                      Details
                    </button>
                    {activeTab === "pending" && app.currentStage === "SP_PENDING" && (
                      <button
                        className="btn btn-success"
                        onClick={() => openActionModal(app.applicationId, "forward")}
                        title="Forward to SDPO"
                      >
                        SDPO →
                      </button>
                    )}
                    {activeTab === "review" && app.currentStage === "SP_REVIEW_PENDING" && (
                      <button
                        className="btn btn-primary"
                        onClick={() => openActionModal(app.applicationId, "recommend")}
                        title="Recommend to DC"
                      >
                        DC ✓
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {actionType === "forward"
                    ? "Forward to SDPO (Sub-Divisional Police Officer)"
                    : "Recommend to DC (Deputy Commissioner)"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeActionModal}
                  disabled={processing}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="action-remarks" className="form-label">
                    {actionType === "forward" ? "Remarks" : "Recommendation"}{" "}
                    <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="action-remarks"
                    className="form-control"
                    rows="4"
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    placeholder={
                      actionType === "forward"
                        ? "Enter your remarks for SDPO..."
                        : "Enter your recommendation for DC..."
                    }
                    disabled={processing}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeActionModal}
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={
                    actionType === "forward"
                      ? handleForwardToSDPO
                      : handleRecommendToDC
                  }
                  disabled={processing || !actionRemarks.trim()}
                >
                  {processing
                    ? "Processing..."
                    : actionType === "forward"
                    ? "Forward to SDPO"
                    : "Send Recommendation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SPDashboard;
