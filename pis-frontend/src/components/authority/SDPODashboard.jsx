import React, { useEffect, useState } from "react";
import {
  getInboxByStage,
  forwardToOC,
  forwardToSPFromSDPO,
  downloadDocument,
  getAuthorityApplicationsByStatus,
} from "../../services/AuthorityService";
import { useNavigate } from "react-router-dom";

const SDPODashboard = () => {
  const [applications, setApplications] = useState({
    pending: [],
    review: [],
    approved: [],
    rejected: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [actionRemarks, setActionRemarks] = useState("");
  const [actionType, setActionType] = useState(""); // "forward-oc" | "forward-sp"
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const navigate = useNavigate();

  const getLocationText = (app) =>
    app.fullAddress ||
    [app.venueName, app.locality, app.pincode].filter(Boolean).join(", ") ||
    "N/A";

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    setLoading(true);
    setError(null);

    Promise.all([
      getInboxByStage("SDPO_PENDING"),
      getInboxByStage("SDPO_REVIEW_PENDING"),
      getAuthorityApplicationsByStatus("APPROVED"),
      getAuthorityApplicationsByStatus("REJECTED"),
    ])
      .then(([pendingRes, reviewRes, approvedRes, rejectedRes]) => {
        console.log("SDPO_PENDING:", pendingRes.data);
        console.log("SDPO_REVIEW_PENDING:", reviewRes.data);
        setApplications({
          pending: pendingRes.data || [],
          review: reviewRes.data || [],
          approved: approvedRes.data || [],
          rejected: rejectedRes.data || [],
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
   * Forward to OC (Officer-in-Charge)
   */
  const handleForwardToOC = () => {
    if (!actionRemarks.trim()) {
      alert("Please enter remarks before forwarding");
      return;
    }

    setProcessing(true);
    forwardToOC(selectedAppId, actionRemarks)
      .then((res) => {
        console.log("Application forwarded to OC:", res.data);
        alert("Application forwarded to OC successfully!");
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

  const handleForwardToSP = () => {
    if (!actionRemarks.trim()) {
      alert("Please enter remarks before forwarding");
      return;
    }

    setProcessing(true);
    forwardToSPFromSDPO(selectedAppId, actionRemarks)
      .then((res) => {
        console.log("Application forwarded to SP:", res.data);
        alert("Application forwarded to SP for review successfully!");
        setShowActionModal(false);
        setActionRemarks("");
        setSelectedAppId(null);
        setActionType("");
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

  const currentList = applications[activeTab] || [];

  return (
    <div className="container mt-4">
      <h2 className="text-center">SDPO (Sub-Divisional Police Officer) Dashboard</h2>
      <p className="text-center text-muted">Manage pending and review stage applications</p>

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
                          state: { from: "/authority/sdpo-dashboard", tab: activeTab },
                        })
                      }
                      title="View full details"
                    >
                      Details
                    </button>
                    {activeTab === "pending" && app.currentStage === "SDPO_PENDING" && (
                      <button
                        className="btn btn-success"
                        onClick={() => openActionModal(app.applicationId, "forward-oc")}
                        title="Assign to OC"
                      >
                        OC →
                      </button>
                    )}
                    {activeTab === "review" && app.currentStage === "SDPO_REVIEW_PENDING" && (
                      <button
                        className="btn btn-primary"
                        onClick={() => openActionModal(app.applicationId, "forward-sp")}
                        title="Forward to SP for review"
                      >
                        SP →
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
                  {actionType === "forward-oc"
                    ? "Assign to OC (Officer-in-Charge)"
                    : "Forward to SP for Review"}
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
                    Remarks{" "}
                    <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="action-remarks"
                    className="form-control"
                    rows="4"
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    placeholder={
                      actionType === "forward-oc"
                        ? "Enter assignment details for OC..."
                        : "Enter your SDPO review remarks for SP..."
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
                  onClick={actionType === "forward-oc" ? handleForwardToOC : handleForwardToSP}
                  disabled={processing || !actionRemarks.trim()}
                >
                  {processing
                    ? "Processing..."
                    : actionType === "forward-oc"
                    ? "Assign to OC"
                    : "Forward to SP"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SDPODashboard;
