import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getApplicationById,
  forwardToSP,
  forwardToSDPO,
  forwardToOC,
  submitOCReport,
  forwardToSPFromSDPO,
  recommendToDC,
  approveByDC,
  rejectByDC,
  downloadDocument
} from "../../services/AuthorityService";

const AuthorityApplicationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [remarks, setRemarks] = useState("");
  const [report, setReport] = useState("");

  const roleName = localStorage.getItem("roleName");

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = () => {
    setLoading(true);
    getApplicationById(id)
      .then((res) => {
        console.log("Application loaded successfully:", res.data);
        setApp(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading application:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to load application";
        setError(errorMessage);
        setLoading(false);
      });
  };

  /**
   * Download or view the applicant's uploaded document
   */
  const handleDownloadDocument = () => {
    if (!app.documentFileName) {
      alert("No document available for download");
      return;
    }

    downloadDocument(id)
      .then((response) => {
        try {
          // Get filename from Content-Disposition header or use app.documentFileName
          const contentDisposition = response.headers["content-disposition"];
          let fileName = app.documentFileName;
          
          if (contentDisposition && contentDisposition.includes("filename")) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match) {
              fileName = match[1];
            }
          }

          // Get the content type from response headers
          const contentType = response.headers["content-type"] || "";
          
          // Create blob with correct MIME type
          const blob = new Blob([response.data], { type: contentType });
          const url = window.URL.createObjectURL(blob);
          
          // Check if it's a viewable file type (PDF, images)
          const viewableTypes = ["application/pdf", "image/jpeg", "image/png", "image/gif"];
          const isViewable = viewableTypes.some(type => contentType.includes(type));
          
          if (isViewable) {
            // Open in new tab for viewing
            window.open(url, "_blank");
            // Don't revoke URL immediately - let browser load it first
            setTimeout(() => window.URL.revokeObjectURL(url), 5000);
          } else {
            // For other files, trigger download
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            // Cleanup after download
            window.URL.revokeObjectURL(url);
          }
        } catch (err) {
          console.error("Error processing document:", err);
          alert("Error processing document. Please try again.");
        }
      })
      .catch((err) => {
        console.error("Error downloading document:", err);
        alert("Error downloading document. Please try again.");
      });
  };

  /**
   * DC (DEPUTY_COMMISSIONER) at stage DC_PENDING forwards to SP
   */
  const handleDCForwardToSP = () => {
    if (!remarks.trim()) {
      alert("Please enter remarks before forwarding!");
      return;
    }
    forwardToSP(id, remarks)
      .then(() => {
        alert("Application forwarded to SP successfully!");
        setRemarks("");
        loadApplication();
      })
      .catch((err) => {
        console.error("Error forwarding to SP:", err);
        alert("Error forwarding application");
      });
  };

  /**
   * SP (AUTHORITY) at stage SP_PENDING forwards to SDPO
   */
  const handleSPForwardToSDPO = () => {
    if (!remarks.trim()) {
      alert("Please enter remarks before forwarding!");
      return;
    }
    forwardToSDPO(id, remarks)
      .then(() => {
        alert("Application forwarded to SDPO successfully!");
        setRemarks("");
        loadApplication();
      })
      .catch((err) => {
        console.error("Error forwarding to SDPO:", err);
        alert("Error forwarding application");
      });
  };

  /**
   * SDPO (SUB_DIVISIONAL_POLICE_OFFICER) at stage SDPO_PENDING forwards to OC
   */
  const handleSDPOForwardToOC = () => {
    if (!remarks.trim()) {
      alert("Please enter remarks before forwarding!");
      return;
    }
    forwardToOC(id, remarks)
      .then(() => {
        alert("Application forwarded to OC successfully!");
        setRemarks("");
        loadApplication();
      })
      .catch((err) => {
        console.error("Error forwarding to OC:", err);
        alert("Error forwarding application");
      });
  };

  /**
   * OC (OFFICER_IN_CHARGE) at stage OC_PENDING submits report
   */
  const handleOCSubmitReport = () => {
    if (!report.trim()) {
      alert("Please enter the investigation report!");
      return;
    }
    submitOCReport(id, report)
      .then(() => {
        alert("Investigation report submitted successfully!");
        setReport("");
        loadApplication();
      })
      .catch((err) => {
        console.error("Error submitting report:", err);
        alert("Error submitting report");
      });
  };

  /**
   * SDPO at stage SDPO_REVIEW_PENDING forwards to SP after OC report
   */
  const handleSDPOForwardToSPAfterOC = () => {
    if (!remarks.trim()) {
      alert("Please enter remarks before forwarding!");
      return;
    }
    forwardToSPFromSDPO(id, remarks)
      .then(() => {
        alert("Application forwarded to SP for review!");
        setRemarks("");
        loadApplication();
      })
      .catch((err) => {
        console.error("Error forwarding to SP:", err);
        alert("Error forwarding application");
      });
  };

  /**
   * SP at stage SP_REVIEW_PENDING recommends to DC
   */
  const handleSPRecommendToDC = () => {
    if (!remarks.trim()) {
      alert("Please enter recommendation remarks!");
      return;
    }
    recommendToDC(id, remarks)
      .then(() => {
        alert("Recommendation sent to DC successfully!");
        setRemarks("");
        loadApplication();
      })
      .catch((err) => {
        console.error("Error recommending to DC:", err);
        alert("Error sending recommendation");
      });
  };

  /**
   * DC at stage DC_FINAL_PENDING approves application
   */
  const handleDCApprove = () => {
    if (!remarks.trim()) {
      alert("Please enter approval remarks!");
      return;
    }
    approveByDC(id, remarks)
      .then(() => {
        alert("Application approved! Permit generated successfully!");
        setRemarks("");
        loadApplication();
        setTimeout(() => navigate("/authority/inbox"), 2000);
      })
      .catch((err) => {
        console.error("Error approving application:", err);
        alert("Error approving application");
      });
  };

  /**
   * DC rejects application (available at DC_PENDING and DC_FINAL_PENDING stages)
   */
  const handleDCReject = () => {
    if (!remarks.trim()) {
      alert("Please enter rejection remarks!");
      return;
    }
    if (!window.confirm("Are you sure you want to reject this application?")) {
      return;
    }
    rejectByDC(id, remarks)
      .then(() => {
        alert("Application rejected successfully!");
        setRemarks("");
        loadApplication();
        setTimeout(() => navigate("/authority/inbox"), 2000);
      })
      .catch((err) => {
        console.error("Error rejecting application:", err);
        alert("Error rejecting application");
      });
  };

  if (loading) return <p className="text-center mt-4">Loading application details...</p>;
  if (error) return <div className="container mt-4"><div className="alert alert-danger">{error}</div><button className="btn btn-secondary" onClick={() => navigate("/authority/inbox")}>Back to Inbox</button></div>;
  if (!app) return <p className="text-center mt-4 text-danger">Failed to load application</p>;

  // Debug logs
  console.log("Role Name:", roleName);
  console.log("Current Stage:", app?.currentStage);
  console.log("Full App Object:", app);

  return (
    <div className="container mt-4">
      <h2 className="text-center">Application Details</h2>
      <p className="text-center text-muted">Your Role: {roleName}</p>

      <div className="card p-4 mt-3">
        {/* Application Information */}
        <div className="row mb-4">
          <div className="col-md-6">
            <p><b>Application ID:</b> {app.applicationId}</p>
            <p><b>Event Title:</b> {app.eventTitle}</p>
            <p><b>Permit Type:</b> {app.permitType}</p>
            <p><b>Location:</b> {app.locationTag}</p>
          </div>
          <div className="col-md-6">
            <p><b>Status:</b> <span className="badge bg-primary">{app.status}</span></p>
            <p><b>Current Stage:</b> <span className="badge bg-info">{app.currentStage}</span></p>
            <p><b>Applicant User ID:</b> {app.userId}</p>
            <p>
              <b>Document:</b> {app.documentFileName}{" "}
              {app.complete && (
                <span className="badge bg-success ms-2">Complete</span>
              )}
              <br />
              {app.documentFileName && (
                <button
                  className="btn btn-sm btn-info mt-2"
                  onClick={handleDownloadDocument}
                  title="Click to download or view document"
                >
                  <i className="bi bi-download"></i> Download/View
                </button>
              )}
            </p>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label><b>Purpose:</b></label>
            <p className="mt-2 p-2 bg-light">{app.purpose}</p>
          </div>
          <div className="col-md-6">
            <label><b>Start DateTime:</b></label>
            <p className="mt-2 p-2 bg-light">{app.startDateTime}</p>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label><b>End DateTime:</b></label>
            <p className="mt-2 p-2 bg-light">{app.endDateTime}</p>
          </div>
        </div>

        {/* DC Remarks */}
        {app.dcRemarks && (
          <div className="alert alert-info mt-2">
            <b>DC Remarks:</b> {app.dcRemarks}
          </div>
        )}

        {/* SP Remarks */}
        {app.spRemarks && (
          <div className="alert alert-info mt-2">
            <b>SP Remarks:</b> {app.spRemarks}
          </div>
        )}

        {/* SDPO Remarks */}
        {app.sdpoRemarks && (
          <div className="alert alert-info mt-2">
            <b>SDPO Remarks:</b> {app.sdpoRemarks}
          </div>
        )}

        {/* OC Report */}
        {app.ocReport && (
          <div className="alert alert-info mt-2">
            <b>OC Investigation Report:</b> {app.ocReport}
          </div>
        )}

        <hr />

        {/* ROLE-BASED ACTIONS */}

        {/* DC (DEPUTY_COMMISSIONER) at stage DC_PENDING */}
        {roleName === "DC" && app.currentStage === "DC_PENDING" && (
          <div className="mt-4">
            <h5>DC Action - Initial Review</h5>
            <label><b>Add Remarks:</b></label>
            <textarea
              className="form-control mb-2"
              rows="4"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter your remarks"
            ></textarea>

            <button className="btn btn-primary me-2" onClick={handleDCForwardToSP}>
              Forward to SP
            </button>

            <button className="btn btn-danger" onClick={handleDCReject}>
              Reject Application
            </button>
          </div>
        )}

        {/* DC (DEPUTY_COMMISSIONER) at stage DC_FINAL_PENDING */}
        {roleName === "DC" && app.currentStage === "DC_FINAL_PENDING" && (
          <div className="mt-4">
            <h5>DC Action - Final Decision</h5>
            <label><b>Add Remarks:</b></label>
            <textarea
              className="form-control mb-2"
              rows="4"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter your remarks"
            ></textarea>

            <button className="btn btn-success me-2" onClick={handleDCApprove}>
              Approve & Generate Permit
            </button>

            <button className="btn btn-danger" onClick={handleDCReject}>
              Reject Application
            </button>
          </div>
        )}

        {/* SP (AUTHORITY) at stage SP_PENDING or SP_REVIEW_PENDING */}
        {roleName === "SP" && (app.currentStage === "SP_PENDING" || app.currentStage === "SP_REVIEW_PENDING") && (
          <div className="mt-4">
            <h5>SP Action</h5>
            <label><b>Add Remarks:</b></label>
            <textarea
              className="form-control mb-2"
              rows="4"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter your remarks"
            ></textarea>

            {app.currentStage === "SP_PENDING" && (
              <button className="btn btn-primary" onClick={handleSPForwardToSDPO}>
                Forward to SDPO
              </button>
            )}

            {app.currentStage === "SP_REVIEW_PENDING" && (
              <button className="btn btn-warning" onClick={handleSPRecommendToDC}>
                Recommend to DC
              </button>
            )}
          </div>
        )}

        {/* SDPO at stage SDPO_PENDING or SDPO_REVIEW_PENDING */}
        {roleName === "SDPO" && (app.currentStage === "SDPO_PENDING" || app.currentStage === "SDPO_REVIEW_PENDING") && (
          <div className="mt-4">
            <h5>SDPO Action</h5>
            <label><b>Add Remarks:</b></label>
            <textarea
              className="form-control mb-2"
              rows="4"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter your remarks"
            ></textarea>

            {app.currentStage === "SDPO_PENDING" && (
              <button className="btn btn-primary" onClick={handleSDPOForwardToOC}>
                Forward to Officer in Charge
              </button>
            )}

            {app.currentStage === "SDPO_REVIEW_PENDING" && (
              <button className="btn btn-success" onClick={handleSDPOForwardToSPAfterOC}>
                Forward to SP for Review
              </button>
            )}
          </div>
        )}

        {/* OC (OFFICER_IN_CHARGE) at stage OC_PENDING */}
        {roleName === "OC" && app.currentStage === "OC_PENDING" && (
          <div className="mt-4">
            <h5>Officer in Charge - Investigation Report</h5>
            <label><b>Investigation Report:</b></label>
            <textarea
              className="form-control mb-2"
              rows="6"
              value={report}
              onChange={(e) => setReport(e.target.value)}
              placeholder="Enter your investigation findings and observations"
            ></textarea>

            <button className="btn btn-success" onClick={handleOCSubmitReport}>
              Submit Investigation Report
            </button>
          </div>
        )}

        {/* If completed or assigned to wrong user */}
        {app.currentStage === "COMPLETED" && (
          <div className="alert alert-success mt-4">
            <b>This application has been completed.</b> Final Status: <b>{app.status}</b>
          </div>
        )}

        {!["DC", "SP", "SDPO", "OC"].includes(roleName) && app && app.currentStage && app.currentStage !== "COMPLETED" && (
          <div className="alert alert-warning mt-4">
            <b>You don't have permission to process this application.</b> Your role: {roleName}
          </div>
        )}

        {["DC", "SP", "SDPO", "OC"].includes(roleName) && app && app.currentStage && ((roleName === "DC" && !["DC_PENDING", "DC_FINAL_PENDING"].includes(app.currentStage)) ||
          (roleName === "SP" && !["SP_PENDING", "SP_REVIEW_PENDING"].includes(app.currentStage)) ||
          (roleName === "SDPO" && !["SDPO_PENDING", "SDPO_REVIEW_PENDING"].includes(app.currentStage)) ||
          (roleName === "OC" && app.currentStage !== "OC_PENDING")) && app.currentStage !== "COMPLETED" && (
          <div className="alert alert-info mt-4">
            <b>This application is not currently assigned to you.</b> Current Stage: <b>{app.currentStage}</b>
          </div>
        )}
      </div>

      <div className="text-center mt-4">
        <button className="btn btn-secondary" onClick={() => navigate("/authority/inbox")}>
          Back to Inbox
        </button>
      </div>
    </div>
  );
};

export default AuthorityApplicationDetails;
