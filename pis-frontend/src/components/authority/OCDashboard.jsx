import React, { useEffect, useState } from "react";
import {
  getInboxByStage,
  submitOCReport,
  viewDocument,
  getAuthorityApplicationsByStatus,
  getJurisdictionAwareApplications,
} from "../../services/AuthorityService";
import { useNavigate } from "react-router-dom";

const OCDashboard = () => {
  const [applications, setApplications] = useState({
    pending: [],
    all: [],
    approved: [],
    rejected: [],
    incomplete: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [reportText, setReportText] = useState("");
  const [reportPdfFile, setReportPdfFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  
  // Pagination and search for Applications tab
  const [applicationSearchQuery, setApplicationSearchQuery] = useState("");
  const [applicationCurrentPage, setApplicationCurrentPage] = useState(1);
  const [applicationItemsPerPage, setApplicationItemsPerPage] = useState(5);
  
  // Pagination for Approved Applications tab
  const [approvedCurrentPage, setApprovedCurrentPage] = useState(1);
  const [approvedItemsPerPage, setApprovedItemsPerPage] = useState(5);
  
  // Pagination for Rejected Applications tab
  const [rejectedCurrentPage, setRejectedCurrentPage] = useState(1);
  const [rejectedItemsPerPage, setRejectedItemsPerPage] = useState(5);
  
  // Pagination for Incomplete Applications tab
  const [incompleteCurrentPage, setIncompleteCurrentPage] = useState(1);
  const [incompleteItemsPerPage, setIncompleteItemsPerPage] = useState(5);
  
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

  const getIncompleteApplications = (list) =>
    (list || []).filter((item) => {
      const status = (item.status || "").toUpperCase();
      return status !== "APPROVED" && status !== "REJECTED";
    });

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    setLoading(true);
    setError(null);

    Promise.all([
      getInboxByStage("OC_PENDING"),
      getJurisdictionAwareApplications(),
      getAuthorityApplicationsByStatus("APPROVED"),
      getAuthorityApplicationsByStatus("REJECTED"),
    ])
      .then(([pendingRes, allAppsRes, approvedRes, rejectedRes]) => {
        console.log("OC_PENDING applications:", pendingRes.data);
        console.log("All Applications (Jurisdiction-aware):", allAppsRes.data);

        const allApplications = allAppsRes.data || [];
        const incompleteApplications = getIncompleteApplications(allApplications);
        setApplications({
          pending: pendingRes.data || [],
          all: sortByApplicationIdDesc(allApplications),
          approved: sortByApplicationIdDesc(approvedRes.data || []),
          rejected: sortByApplicationIdDesc(rejectedRes.data || []),
          incomplete: sortByApplicationIdDesc(incompleteApplications),
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

  /**
   * Filter applications by search query
   */
  const filterApplications = (list) => {
    if (!applicationSearchQuery.trim()) return list;

    const query = applicationSearchQuery.toLowerCase();
    return list.filter((app) => {
      return (
        String(app.applicationId || "").toLowerCase().includes(query) ||
        (app.eventTitle || "").toLowerCase().includes(query) ||
        (app.permitType || "").toLowerCase().includes(query) ||
        (app.status || "").toLowerCase().includes(query) ||
        getLocationText(app).toLowerCase().includes(query)
      );
    });
  };

  /**
   * Handle tab change
   */
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === "all") {
      setApplicationSearchQuery("");
      setApplicationCurrentPage(1);
    }
    if (tabName === "approved") {
      setApprovedCurrentPage(1);
    }
    if (tabName === "rejected") {
      setRejectedCurrentPage(1);
    }
    if (tabName === "incomplete") {
      setIncompleteCurrentPage(1);
    }
  };

  /**
   * Handle search input change for Applications tab
   */
  const handleApplicationSearchChange = (e) => {
    setApplicationSearchQuery(e.target.value);
    setApplicationCurrentPage(1);
  };

  /**
   * Handle items per page change for Applications tab
   */
  const handleApplicationItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value, 10) || 5;
    setApplicationItemsPerPage(value);
    setApplicationCurrentPage(1);
  };

  /**
   * Handle page change for Applications tab
   */
  const handleApplicationPageChange = (pageNumber) => {
    setApplicationCurrentPage(pageNumber);
  };

  /**
   * Handle items per page change for Approved Applications tab
   */
  const handleApprovedItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value, 10) || 5;
    setApprovedItemsPerPage(value);
    setApprovedCurrentPage(1);
  };

  /**
   * Handle page change for Approved Applications tab
   */
  const handleApprovedPageChange = (pageNumber) => {
    setApprovedCurrentPage(pageNumber);
  };

  /**
   * Handle items per page change for Rejected Applications tab
   */
  const handleRejectedItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value, 10) || 5;
    setRejectedItemsPerPage(value);
    setRejectedCurrentPage(1);
  };

  /**
   * Handle page change for Rejected Applications tab
   */
  const handleRejectedPageChange = (pageNumber) => {
    setRejectedCurrentPage(pageNumber);
  };

  /**
   * Handle items per page change for Incomplete Applications tab
   */
  const handleIncompleteItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value, 10) || 5;
    setIncompleteItemsPerPage(value);
    setIncompleteCurrentPage(1);
  };

  /**
   * Handle page change for Incomplete Applications tab
   */
  const handleIncompletePageChange = (pageNumber) => {
    setIncompleteCurrentPage(pageNumber);
  };

  if (loading) return <p className="text-center mt-4">Loading...</p>;

  const currentList = applications[activeTab] || [];

  // Pagination calculations for Applications tab
  const applicationsList = applications.all || [];
  const filteredApplicationsList = filterApplications(applicationsList);
  const applicationTotalPages = Math.ceil(
    filteredApplicationsList.length / applicationItemsPerPage
  );
  const applicationStartIndex =
    (applicationCurrentPage - 1) * applicationItemsPerPage;
  const paginatedApplicationsList = filteredApplicationsList.slice(
    applicationStartIndex,
    applicationStartIndex + applicationItemsPerPage
  );

  // Pagination calculations for Approved Applications tab
  const approvedList = applications.approved || [];
  const approvedTotalPages = Math.ceil(approvedList.length / approvedItemsPerPage);
  const approvedStartIndex = (approvedCurrentPage - 1) * approvedItemsPerPage;
  const paginatedApprovedList = approvedList.slice(
    approvedStartIndex,
    approvedStartIndex + approvedItemsPerPage
  );

  // Pagination calculations for Rejected Applications tab
  const rejectedList = applications.rejected || [];
  const rejectedTotalPages = Math.ceil(rejectedList.length / rejectedItemsPerPage);
  const rejectedStartIndex = (rejectedCurrentPage - 1) * rejectedItemsPerPage;
  const paginatedRejectedList = rejectedList.slice(
    rejectedStartIndex,
    rejectedStartIndex + rejectedItemsPerPage
  );

  // Pagination calculations for Incomplete Applications tab
  const incompleteList = applications.incomplete || [];
  const incompleteTotalPages = Math.ceil(incompleteList.length / incompleteItemsPerPage);
  const incompleteStartIndex = (incompleteCurrentPage - 1) * incompleteItemsPerPage;
  const paginatedIncompleteList = incompleteList.slice(
    incompleteStartIndex,
    incompleteStartIndex + incompleteItemsPerPage
  );

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
            onClick={() => handleTabChange("pending")}
          >
            📋 New ({applications.pending?.length || 0})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "all" ? "active" : ""}`}
            onClick={() => handleTabChange("all")}
          >
            📁 Applications ({applications.all?.length || 0})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => handleTabChange("approved")}
          >
            ✅ Approved Applications ({applications.approved?.length || 0})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "rejected" ? "active" : ""}`}
            onClick={() => handleTabChange("rejected")}
          >
            ❌ Rejected Applications ({applications.rejected?.length || 0})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "incomplete" ? "active" : ""}`}
            onClick={() => handleTabChange("incomplete")}
          >
            ⏳ Incomplete ({applications.incomplete?.length || 0})
          </button>
        </li>
      </ul>

      {/* Applications Tab - Search and Pagination Controls */}
      {activeTab === "all" && (
        <div className="mt-4 mb-3">
          <div className="d-flex align-items-center gap-3 mb-3">
            <input
              type="text"
              className="form-control flex-grow-1"
              placeholder="Search by Application ID, Event Title, Permit Type, Status, or Location..."
              value={applicationSearchQuery}
              onChange={handleApplicationSearchChange}
            />
          </div>
          <div className="d-flex align-items-center gap-3">
            <label
              htmlFor="itemsPerPageSelectApplications"
              className="form-label mb-0"
            >
              Items per page:
            </label>
            <select
              id="itemsPerPageSelectApplications"
              className="form-select"
              style={{ maxWidth: "150px" }}
              value={applicationItemsPerPage}
              onChange={handleApplicationItemsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
            <small className="text-muted ms-3">
              Showing {paginatedApplicationsList.length} of{" "}
              {filteredApplicationsList.length} applications
            </small>
          </div>
        </div>
      )}

      {/* Approved Applications Tab - Pagination Controls */}
      {activeTab === "approved" && (
        <div className="mt-4 mb-3">
          <div className="d-flex align-items-center gap-3">
            <label
              htmlFor="itemsPerPageSelectApproved"
              className="form-label mb-0"
            >
              Items per page:
            </label>
            <select
              id="itemsPerPageSelectApproved"
              className="form-select"
              style={{ maxWidth: "150px" }}
              value={approvedItemsPerPage}
              onChange={handleApprovedItemsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
            <small className="text-muted ms-3">
              Showing {paginatedApprovedList.length} of{" "}
              {approvedList.length} applications
            </small>
          </div>
        </div>
      )}

      {/* Rejected Applications Tab - Pagination Controls */}
      {activeTab === "rejected" && (
        <div className="mt-4 mb-3">
          <div className="d-flex align-items-center gap-3">
            <label
              htmlFor="itemsPerPageSelectRejected"
              className="form-label mb-0"
            >
              Items per page:
            </label>
            <select
              id="itemsPerPageSelectRejected"
              className="form-select"
              style={{ maxWidth: "150px" }}
              value={rejectedItemsPerPage}
              onChange={handleRejectedItemsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
            <small className="text-muted ms-3">
              Showing {paginatedRejectedList.length} of{" "}
              {rejectedList.length} applications
            </small>
          </div>
        </div>
      )}

      {/* Incomplete Applications Tab - Pagination Controls */}
      {activeTab === "incomplete" && (
        <div className="mt-4 mb-3">
          <div className="d-flex align-items-center gap-3">
            <label
              htmlFor="itemsPerPageSelectIncomplete"
              className="form-label mb-0"
            >
              Items per page:
            </label>
            <select
              id="itemsPerPageSelectIncomplete"
              className="form-select"
              style={{ maxWidth: "150px" }}
              value={incompleteItemsPerPage}
              onChange={handleIncompleteItemsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
            <small className="text-muted ms-3">
              Showing {paginatedIncompleteList.length} of{" "}
              {incompleteList.length} applications
            </small>
          </div>
        </div>
      )}

      {/* Applications Tab - Empty State Messages */}
      {activeTab === "all" && currentList.length === 0 && !error && (
        <p className="text-center mt-4 text-muted">No applications to display</p>
      )}

      {activeTab === "all" &&
        filteredApplicationsList.length === 0 &&
        currentList.length > 0 &&
        !error && (
          <p className="text-center mt-4 text-muted">
            No applications match your search
          </p>
        )}

      {currentList.length === 0 && !error && (
        <p className="text-center mt-4 text-muted">
          No applications to display
        </p>
      )}

      {(activeTab === "all" ? paginatedApplicationsList.length > 0 : activeTab === "approved" ? paginatedApprovedList.length > 0 : activeTab === "rejected" ? paginatedRejectedList.length > 0 : activeTab === "incomplete" ? paginatedIncompleteList.length > 0 : currentList.length > 0) && (
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
                <th>Document</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === "all" ? paginatedApplicationsList : activeTab === "approved" ? paginatedApprovedList : activeTab === "rejected" ? paginatedRejectedList : activeTab === "incomplete" ? paginatedIncompleteList : currentList).map((app) => (
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
                    <button
                      className="btn btn-sm btn-link p-0"
                      onClick={() => navigate(`/application/${app.applicationId}/timeline`)}
                      title="View application timeline"
                      style={{ textDecoration: "none" }}
                    >
                      <span className="badge bg-info">{app.status}</span>
                    </button>
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

          {/* Pagination Controls for Applications Tab */}
          {activeTab === "all" && applicationTotalPages > 1 && (
            <nav className="d-flex justify-content-center mt-4" aria-label="Pagination">
              <ul className="pagination">
                <li className={`page-item ${applicationCurrentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleApplicationPageChange(1)}
                    disabled={applicationCurrentPage === 1}
                  >
                    « First
                  </button>
                </li>
                <li className={`page-item ${applicationCurrentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleApplicationPageChange(applicationCurrentPage - 1)}
                    disabled={applicationCurrentPage === 1}
                  >
                    ‹ Previous
                  </button>
                </li>

                {applicationCurrentPage > 3 && (
                  <>
                    <li className="page-item">
                      <button className="page-link" onClick={() => handleApplicationPageChange(1)}>
                        1
                      </button>
                    </li>
                    {applicationCurrentPage > 4 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                  </>
                )}

                {Array.from({ length: 5 }, (_, i) => applicationCurrentPage - 2 + i)
                  .filter((page) => page > 0 && page <= applicationTotalPages)
                  .map((page) => (
                    <li key={page} className={`page-item ${applicationCurrentPage === page ? "active" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => handleApplicationPageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))}

                {applicationCurrentPage < applicationTotalPages - 2 && (
                  <>
                    {applicationCurrentPage < applicationTotalPages - 3 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                    <li className="page-item">
                      <button
                        className="page-link"
                        onClick={() => handleApplicationPageChange(applicationTotalPages)}
                      >
                        {applicationTotalPages}
                      </button>
                    </li>
                  </>
                )}

                <li className={`page-item ${applicationCurrentPage === applicationTotalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleApplicationPageChange(applicationCurrentPage + 1)}
                    disabled={applicationCurrentPage === applicationTotalPages}
                  >
                    Next ›
                  </button>
                </li>
                <li className={`page-item ${applicationCurrentPage === applicationTotalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleApplicationPageChange(applicationTotalPages)}
                    disabled={applicationCurrentPage === applicationTotalPages}
                  >
                    Last »
                  </button>
                </li>
              </ul>
            </nav>
          )}

          {/* Pagination Controls for Approved Applications Tab */}
          {activeTab === "approved" && approvedTotalPages > 1 && (
            <nav className="d-flex justify-content-center mt-4" aria-label="Pagination">
              <ul className="pagination">
                <li className={`page-item ${approvedCurrentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleApprovedPageChange(1)}
                    disabled={approvedCurrentPage === 1}
                  >
                    « First
                  </button>
                </li>
                <li className={`page-item ${approvedCurrentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleApprovedPageChange(approvedCurrentPage - 1)}
                    disabled={approvedCurrentPage === 1}
                  >
                    ‹ Previous
                  </button>
                </li>

                {approvedCurrentPage > 3 && (
                  <>
                    <li className="page-item">
                      <button className="page-link" onClick={() => handleApprovedPageChange(1)}>
                        1
                      </button>
                    </li>
                    {approvedCurrentPage > 4 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                  </>
                )}

                {Array.from({ length: 5 }, (_, i) => approvedCurrentPage - 2 + i)
                  .filter((page) => page > 0 && page <= approvedTotalPages)
                  .map((page) => (
                    <li key={page} className={`page-item ${approvedCurrentPage === page ? "active" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => handleApprovedPageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))}

                {approvedCurrentPage < approvedTotalPages - 2 && (
                  <>
                    {approvedCurrentPage < approvedTotalPages - 3 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                    <li className="page-item">
                      <button
                        className="page-link"
                        onClick={() => handleApprovedPageChange(approvedTotalPages)}
                      >
                        {approvedTotalPages}
                      </button>
                    </li>
                  </>
                )}

                <li className={`page-item ${approvedCurrentPage === approvedTotalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleApprovedPageChange(approvedCurrentPage + 1)}
                    disabled={approvedCurrentPage === approvedTotalPages}
                  >
                    Next ›
                  </button>
                </li>
                <li className={`page-item ${approvedCurrentPage === approvedTotalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleApprovedPageChange(approvedTotalPages)}
                    disabled={approvedCurrentPage === approvedTotalPages}
                  >
                    Last »
                  </button>
                </li>
              </ul>
            </nav>
          )}

          {/* Pagination Controls for Rejected Applications Tab */}
          {activeTab === "rejected" && rejectedTotalPages > 1 && (
            <nav className="d-flex justify-content-center mt-4" aria-label="Pagination">
              <ul className="pagination">
                <li className={`page-item ${rejectedCurrentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleRejectedPageChange(1)}
                    disabled={rejectedCurrentPage === 1}
                  >
                    « First
                  </button>
                </li>
                <li className={`page-item ${rejectedCurrentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleRejectedPageChange(rejectedCurrentPage - 1)}
                    disabled={rejectedCurrentPage === 1}
                  >
                    ‹ Previous
                  </button>
                </li>

                {rejectedCurrentPage > 3 && (
                  <>
                    <li className="page-item">
                      <button className="page-link" onClick={() => handleRejectedPageChange(1)}>
                        1
                      </button>
                    </li>
                    {rejectedCurrentPage > 4 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                  </>
                )}

                {Array.from({ length: 5 }, (_, i) => rejectedCurrentPage - 2 + i)
                  .filter((page) => page > 0 && page <= rejectedTotalPages)
                  .map((page) => (
                    <li key={page} className={`page-item ${rejectedCurrentPage === page ? "active" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => handleRejectedPageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))}

                {rejectedCurrentPage < rejectedTotalPages - 2 && (
                  <>
                    {rejectedCurrentPage < rejectedTotalPages - 3 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                    <li className="page-item">
                      <button
                        className="page-link"
                        onClick={() => handleRejectedPageChange(rejectedTotalPages)}
                      >
                        {rejectedTotalPages}
                      </button>
                    </li>
                  </>
                )}

                <li className={`page-item ${rejectedCurrentPage === rejectedTotalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleRejectedPageChange(rejectedCurrentPage + 1)}
                    disabled={rejectedCurrentPage === rejectedTotalPages}
                  >
                    Next ›
                  </button>
                </li>
                <li className={`page-item ${rejectedCurrentPage === rejectedTotalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleRejectedPageChange(rejectedTotalPages)}
                    disabled={rejectedCurrentPage === rejectedTotalPages}
                  >
                    Last »
                  </button>
                </li>
              </ul>
            </nav>
          )}

          {/* Pagination Controls for Incomplete Applications Tab */}
          {activeTab === "incomplete" && incompleteTotalPages > 1 && (
            <nav className="d-flex justify-content-center mt-4" aria-label="Pagination">
              <ul className="pagination">
                <li className={`page-item ${incompleteCurrentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleIncompletePageChange(1)}
                    disabled={incompleteCurrentPage === 1}
                  >
                    « First
                  </button>
                </li>
                <li className={`page-item ${incompleteCurrentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleIncompletePageChange(incompleteCurrentPage - 1)}
                    disabled={incompleteCurrentPage === 1}
                  >
                    ‹ Previous
                  </button>
                </li>

                {incompleteCurrentPage > 3 && (
                  <>
                    <li className="page-item">
                      <button className="page-link" onClick={() => handleIncompletePageChange(1)}>
                        1
                      </button>
                    </li>
                    {incompleteCurrentPage > 4 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                  </>
                )}

                {Array.from({ length: 5 }, (_, i) => incompleteCurrentPage - 2 + i)
                  .filter((page) => page > 0 && page <= incompleteTotalPages)
                  .map((page) => (
                    <li key={page} className={`page-item ${incompleteCurrentPage === page ? "active" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => handleIncompletePageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))}

                {incompleteCurrentPage < incompleteTotalPages - 2 && (
                  <>
                    {incompleteCurrentPage < incompleteTotalPages - 3 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                    <li className="page-item">
                      <button
                        className="page-link"
                        onClick={() => handleIncompletePageChange(incompleteTotalPages)}
                      >
                        {incompleteTotalPages}
                      </button>
                    </li>
                  </>
                )}

                <li className={`page-item ${incompleteCurrentPage === incompleteTotalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleIncompletePageChange(incompleteCurrentPage + 1)}
                    disabled={incompleteCurrentPage === incompleteTotalPages}
                  >
                    Next ›
                  </button>
                </li>
                <li className={`page-item ${incompleteCurrentPage === incompleteTotalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => handleIncompletePageChange(incompleteTotalPages)}
                    disabled={incompleteCurrentPage === incompleteTotalPages}
                  >
                    Last »
                  </button>
                </li>
              </ul>
            </nav>
          )}
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
