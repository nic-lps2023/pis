import React, { useEffect, useState } from "react";
import { getInboxByStage, submitOCReport, downloadDocument } from "../../services/AuthorityService";
import { useNavigate } from "react-router-dom";

const OCDashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [reportText, setReportText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    setLoading(true);
    setError(null);

    getInboxByStage("OC_PENDING")
      .then((res) => {
        console.log("OC_PENDING applications:", res.data);
        setApplications(res.data || []);
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
   * Submit investigation report
   */
  const handleSubmitReport = () => {
    if (!reportText.trim()) {
      alert("Please enter the investigation report");
      return;
    }

    setSubmitting(true);
    submitOCReport(selectedAppId, reportText)
      .then((res) => {
        console.log("Report submitted:", res.data);
        alert("Investigation report submitted successfully!");
        setShowReportModal(false);
        setReportText("");
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
  };

  if (loading) return <p className="text-center mt-4">Loading...</p>;

  return (
    <div className="container mt-4">
      <h2 className="text-center">
        OC (Officer-in-Charge) Verification Dashboard
      </h2>
      <p className="text-center text-muted">
        Physical verification and investigation of permit applications
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      {applications.length === 0 && !error && (
        <p className="text-center mt-4 text-muted">
          No applications pending for verification
        </p>
      )}

      {applications.length > 0 && (
        <div>
          <div className="alert alert-info">
            <strong>📋 Pending Verifications:</strong> {applications.length}{" "}
            applications awaiting your physical verification and report.
          </div>

          <table className="table table-bordered table-striped mt-3">
            <thead>
              <tr>
                <th>ID</th>
                <th>Event Title</th>
                <th>Event Date</th>
                <th>Permit Type</th>
                <th>Location</th>
                <th>Purpose</th>
                <th>Document</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
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
                  <td>{app.locationTag}</td>
                  <td>
                    <small>{app.purpose?.substring(0, 50)}...</small>
                  </td>
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
                          navigate(`/authority/application/${app.applicationId}`)
                        }
                        title="View full details and applicant information"
                      >
                        Details
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => openReportModal(app.applicationId)}
                        title="Submit verification report"
                      >
                        Report ✓
                      </button>
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
                  <strong>⚠️ Important:</strong> Please provide a detailed
                  investigation report including physical verification findings,
                  location verification, and any concerns or observations.
                </div>
                <div className="mb-3">
                  <label htmlFor="report-text" className="form-label">
                    Investigation Report <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="report-text"
                    className="form-control"
                    rows="8"
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="Enter your detailed investigation report...

Include:
- Event location verification
- Safety and security assessment
- Any concerns or observations
- Recommendation (Approve/Reject with justification)"
                    disabled={submitting}
                  ></textarea>
                  <small className="text-muted">
                    Word count: {reportText.split(/\s+/).filter(w => w).length}
                  </small>
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
