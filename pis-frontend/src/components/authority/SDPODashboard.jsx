import React, { useEffect, useState } from "react";
import { getInboxByStage, forwardToOC, downloadDocument } from "../../services/AuthorityService";
import { useNavigate } from "react-router-dom";

const SDPODashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [actionRemarks, setActionRemarks] = useState("");
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    setLoading(true);
    setError(null);

    getInboxByStage("SDPO_PENDING")
      .then((res) => {
        console.log("SDPO_PENDING:", res.data);
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
  const openActionModal = (appId) => {
    setSelectedAppId(appId);
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
  };

  if (loading) return <p className="text-center mt-4">Loading...</p>;

  const currentList = applications || [];

  return (
    <div className="container mt-4">
      <h2 className="text-center">SDPO (Sub-Divisional Police Officer) Dashboard</h2>
      <p className="text-center text-muted">Manage OC assignments</p>

      {error && <div className="alert alert-danger">{error}</div>}

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
                        navigate(`/authority/application/${app.applicationId}`)
                      }
                      title="View full details"
                    >
                      Details
                    </button>
                    {app.currentStage === "SDPO_PENDING" && (
                      <button
                        className="btn btn-success"
                        onClick={() => openActionModal(app.applicationId)}
                        title="Assign to OC"
                      >
                        OC →
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
                  Assign to OC (Officer-in-Charge)
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
                    Assignment Details{" "}
                    <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="action-remarks"
                    className="form-control"
                    rows="4"
                    value={actionRemarks}
                    onChange={(e) => setActionRemarks(e.target.value)}
                    placeholder="Enter assignment details for OC..."
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
                  onClick={handleForwardToOC}
                  disabled={processing || !actionRemarks.trim()}
                >
                  {processing ? "Processing..." : "Assign to OC"}
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
