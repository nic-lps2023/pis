import React, { useEffect, useState } from "react";
import {
  getInboxByStage,
  submitOCReport,
  viewDocument,
  getAuthorityApplicationsByStatus,
} from "../../services/AuthorityService";
import { useNavigate } from "react-router-dom";

const OCDashboard = () => {
  const [applications, setApplications] = useState({
    pending: [],
    completed: [],
    approved: [],
    rejected: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [reportText, setReportText] = useState("");
  const [reportPdfFile, setReportPdfFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const navigate = useNavigate();

  const getLocationText = (app) =>
    app.fullAddress ||
    [app.venueName, app.locality, app.pincode].filter(Boolean).join(", ") ||
    "N/A";

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
      getInboxByStage("OC_PENDING"),
      getAuthorityApplicationsByStatus("OC_VERIFIED"),
      getAuthorityApplicationsByStatus("APPROVED"),
      getAuthorityApplicationsByStatus("REJECTED"),
    ])
      .then(([pendingRes, completedRes, approvedRes, rejectedRes]) => {
        console.log("OC_PENDING applications:", pendingRes.data);

        setApplications({
          pending: pendingRes.data || [],
          completed: completedRes.data || [],
          approved: sortByApplicationIdDesc(approvedRes.data || []),
          rejected: sortByApplicationIdDesc(rejectedRes.data || []),
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
   * Submit investigation report (short summary + optional PDF)
   */
  const handleSubmitReport = () => {
    if (!reportText.trim()) {
      alert("Please enter the investigation summary");
      return;
    }

    if (reportPdfFile && reportPdfFile.type !== "application/pdf") {
      alert("Only PDF files are allowed for the investigation report attachment.");
      return;
    }

    setSubmitting(true);
    submitOCReport(selectedAppId, reportText, reportPdfFile || null)
      .then((res) => {
        console.log("Report submitted:", res.data);
        alert("Investigation report submitted successfully!");
        setShowReportModal(false);
        setReportText("");
        setReportPdfFile(null);
        setSelectedAppId(null);
        loadApplications();
      })
      .catch((err) => {
        console.error("Error submitting report:", err);
        alert(
          err.response?.data?.message ||
            "Failed to submit report. Please try again."
        );
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  /**
   * Handle inline document view in new tab
   */
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

  /**
   * Open report modal
   */
  const openReportModal = (appId) => {
    setSelectedAppId(appId);
    setReportText("");
    setShowReportModal(true);
  };

  /**
   * Close report modal
   */
  const closeReportModal = () => {
    setShowReportModal(false);
    setSelectedAppId(null);
    setReportText("");
    setReportPdfFile(null);
  };

  if (loading) return <p className="text-center mt-4">Loading...</p>;

  const currentList = applications[activeTab] || [];

  return (
    <div className="container mt-4">
      <h2 className="text-center">
        OC (Officer-in-Charge) Verification Dashboard
      </h2>
      <p className="text-center text-muted">
        Physical verification and investigation of permit applications
      </p>

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
            className={`nav-link ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            📝 Investigation Completed ({applications.completed?.length || 0})
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
        <p className="text-center mt-4 text-muted">
          No applications to display
        </p>
      )}

      {currentList.length > 0 && (
        <div>
          {activeTab === "pending" && (
            <div className="alert alert-info">
              <strong>📋 Pending Verifications:</strong> {applications.pending?.length || 0}{" "}
              applications awaiting your physical verification and report.
            </div>
          )}

          <table className="table table-bordered table-striped mt-3">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event Title</th>
                <th>Event Date</th>
                <th>Permit Type</th>
                <th>Status</th>
                <th>Location</th>
                <th>Purpose</th>
                <th>Document</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentList.map((app) => (
                <tr key={app.applicationId}>
                  <td>
                    <strong>#{app.applicationId}</strong>
                  </td>
                  <td>{app.eventTitle}</td>
                  <td>
                    {app.startDateTime
                      ? new Date(app.startDateTime).toLocaleDateString()
                      : "N/A"}
                  </td>
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
                    <small>
                      {app.purpose
                        ? `${app.purpose.substring(0, 50)}${app.purpose.length > 50 ? "..." : ""}`
                        : "N/A"}
                    </small>
                  </td>
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
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        className="btn btn-info"
                        onClick={() =>
                          navigate(`/authority/application/${app.applicationId}`, {
                            state: { from: "/authority/oc-dashboard", tab: activeTab },
                          })
                        }
                        title="View full details and applicant information"
                      >
                        Details
                      </button>
                      {activeTab === "pending" && (
                        <button
                          className="btn btn-success"
                          onClick={() => openReportModal(app.applicationId)}
                          title="Submit verification report"
                        >
                          Report ✓
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Submission Modal */}
      {showReportModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Submit Verification Report</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeReportModal}
                  disabled={submitting}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <strong>⚠️ Important:</strong> Enter a concise summary of your
                  investigation findings. You may optionally attach the full
                  investigation report as a PDF (max 5 MB).
                </div>
                <div className="mb-3">
                  <label htmlFor="report-text" className="form-label">
                    Investigation Summary <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="report-text"
                    className="form-control"
                    rows="5"
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="Enter a concise summary of your investigation findings and recommendation (Approve/Reject with justification)..."
                    disabled={submitting}
                  ></textarea>
                  <small className="text-muted">
                    {reportText.split(/\s+/).filter((w) => w).length} words
                  </small>
                </div>
                <div className="mb-3">
                  <label htmlFor="report-pdf" className="form-label">
                    Full Investigation Report PDF{" "}
                    <span className="text-muted">(optional, max 5 MB)</span>
                  </label>
                  <input
                    id="report-pdf"
                    type="file"
                    className="form-control"
                    accept="application/pdf"
                    onChange={(e) =>
                      setReportPdfFile(e.target.files[0] || null)
                    }
                    disabled={submitting}
                  />
                  {reportPdfFile && (
                    <small className="text-success mt-1 d-block">
                      Selected: {reportPdfFile.name} ({
                        (reportPdfFile.size / 1024).toFixed(1)
                      }{" "}
                      KB)
                    </small>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeReportModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSubmitReport}
                  disabled={submitting || !reportText.trim()}
                >
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OCDashboard;
