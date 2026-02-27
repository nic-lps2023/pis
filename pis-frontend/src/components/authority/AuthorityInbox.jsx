import React, { useEffect, useState } from "react";
import { getInboxByStage, forwardToSP, downloadDocument } from "../../services/AuthorityService";
import { useNavigate } from "react-router-dom";

const AuthorityInbox = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [forwardRemarks, setForwardRemarks] = useState("");
  const [forwarding, setForwarding] = useState(false);
  const navigate = useNavigate();

  const getRoleToStageMappings = (roleName, roleId) => {
    const roleIdStageMap = {
      "2": ["DC_PENDING", "DC_FINAL_PENDING"],
      "3": ["SP_PENDING", "SP_REVIEW_PENDING"],
      "4": ["SDPO_PENDING", "SDPO_REVIEW_PENDING"],
      "5": ["OC_PENDING"],
      "6": ["SP_PENDING", "SP_REVIEW_PENDING"],
    };

    const stagesByRoleId = roleIdStageMap[String(roleId || "")];
    if (stagesByRoleId) return stagesByRoleId;

    const roleStageMap = {
      DEPUTY_COMMISSIONER: ["DC_PENDING", "DC_FINAL_PENDING"],
      STATE_POLICE: ["SP_PENDING", "SP_REVIEW_PENDING"],
      SP: ["SP_PENDING", "SP_REVIEW_PENDING"],
      AUTHORITY: ["SP_PENDING", "SP_REVIEW_PENDING"],
      SUB_DIVISIONAL_POLICE_OFFICER: ["SDPO_PENDING", "SDPO_REVIEW_PENDING"],
      SDPO: ["SDPO_PENDING", "SDPO_REVIEW_PENDING"],
      OFFICER_IN_CHARGE: ["OC_PENDING"],
      OC: ["OC_PENDING"],
    };

    return roleStageMap[roleName] || ["DC_PENDING"];
  };

  useEffect(() => {
    loadInbox();
  }, []);

  const loadInbox = () => {
    setLoading(true);
    setError(null);

    try {
      const roleName = localStorage.getItem("roleName");
      const roleId = localStorage.getItem("roleId");

      if (!roleName && !roleId) {
        setError("User role not found. Please log in again.");
        setLoading(false);
        return;
      }

      const stages = getRoleToStageMappings(roleName, roleId);

      console.log(`Loading inbox for role: ${roleName} (${roleId}), stages: ${stages.join(", ")}`);

      Promise.all(stages.map((stage) => getInboxByStage(stage)))
        .then((responses) => {
          const merged = responses.flatMap((res) => res.data || []);
          const deduped = Array.from(
            new Map(merged.map((item) => [item.applicationId, item])).values()
          );

          console.log("Inbox loaded successfully:", deduped);
          setApplications(deduped);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading inbox:", err);
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to load inbox applications";
          setError(errorMessage);
          setLoading(false);
        });
    } catch (err) {
      console.error("Error in loadInbox:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  /**
   * Handle forward to SP action (DC only)
   */
  const handleForwardToSP = () => {
    if (!forwardRemarks.trim()) {
      alert("Please enter remarks before forwarding");
      return;
    }

    setForwarding(true);
    forwardToSP(selectedAppId, forwardRemarks)
      .then((res) => {
        console.log("Application forwarded to SP:", res.data);
        alert("Application forwarded to SP successfully!");
        setShowForwardModal(false);
        setForwardRemarks("");
        setSelectedAppId(null);
        loadInbox(); // Reload inbox
      })
      .catch((err) => {
        console.error("Error forwarding application:", err);
        alert(
          err.response?.data?.message ||
            "Failed to forward application. Please try again."
        );
      })
      .finally(() => {
        setForwarding(false);
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
   * Open forward modal
   */
  const openForwardModal = (appId) => {
    setSelectedAppId(appId);
    setForwardRemarks("");
    setShowForwardModal(true);
  };

  /**
   * Close forward modal
   */
  const closeForwardModal = () => {
    setShowForwardModal(false);
    setSelectedAppId(null);
    setForwardRemarks("");
  };

  if (loading) return <p className="text-center mt-4">Loading...</p>;

  const roleName = localStorage.getItem("roleName");
  const isDC = roleName === "DEPUTY_COMMISSIONER";

  return (
    <div className="container mt-4">
      <h2 className="text-center">Inbox Applications</h2>
      <p className="text-center text-muted">Role: {roleName}</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {applications.length === 0 && !error && (
        <p className="text-center mt-4 text-muted">No applications in your inbox</p>
      )}

      {applications.length > 0 && (
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
            {applications.map((app) => (
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
                      📄 {app.documentFileName.substring(0, 20)}...
                    </button>
                  ) : (
                    <span className="text-muted">No document</span>
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
                    {isDC && app.currentStage === "DC_PENDING" && (
                      <button
                        className="btn btn-success"
                        onClick={() => openForwardModal(app.applicationId)}
                        title="Forward to SP"
                      >
                        Forward →
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Forward to SP Modal */}
      {showForwardModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Forward to SP (State Police)</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeForwardModal}
                  disabled={forwarding}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="remarks" className="form-label">
                    Remarks / Comments <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="remarks"
                    className="form-control"
                    rows="4"
                    value={forwardRemarks}
                    onChange={(e) => setForwardRemarks(e.target.value)}
                    placeholder="Enter your remarks before forwarding to SP..."
                    disabled={forwarding}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeForwardModal}
                  disabled={forwarding}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleForwardToSP}
                  disabled={forwarding || !forwardRemarks.trim()}
                >
                  {forwarding ? "Forwarding..." : "Forward to SP"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorityInbox;
