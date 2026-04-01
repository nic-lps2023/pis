import React, { useEffect, useState } from "react";
import {
  getInboxByStage,
  forwardToOC,
  forwardToSPFromSDPO,
  viewDocument,
  getAuthorityApplicationsByStatus,
  getJurisdictionAwareApplications,
} from "../../services/AuthorityService";
import { useNavigate } from "react-router-dom";

const SDPODashboard = () => {
  const [applications, setApplications] = useState({
    pending: [],
    review: [],
    allApplications: [],
    approved: [],
    rejected: [],
    incomplete: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [actionRemarks, setActionRemarks] = useState("");
  const [actionType, setActionType] = useState(""); // "forward-oc" | "forward-sp"
  const [processing, setProcessing] = useState(false);
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
      getInboxByStage("SDPO_PENDING"),
      getInboxByStage("SDPO_REVIEW_PENDING"),
      getAuthorityApplicationsByStatus("APPROVED"),
      getAuthorityApplicationsByStatus("REJECTED"),
      getJurisdictionAwareApplications(),
    ])
      .then(([pendingRes, reviewRes, approvedRes, rejectedRes, allAppsRes]) => {
        console.log("SDPO_PENDING:", pendingRes.data);
        console.log("SDPO_REVIEW_PENDING:", reviewRes.data);
        console.log("All Applications (Jurisdiction-aware):", allAppsRes.data);
        const allApplications = allAppsRes.data || [];
        setApplications({
          pending: pendingRes.data || [],
          review: reviewRes.data || [],
          allApplications: sortByApplicationIdDesc(allApplications),
          approved: sortByApplicationIdDesc(approvedRes.data || []),
          rejected: sortByApplicationIdDesc(rejectedRes.data || []),
          incomplete: sortByApplicationIdDesc(getIncompleteApplications(allApplications)),
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
   * Handle tab change for Applications tab
   */
  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    if (tabName === "allApplications") {
      setApplicationSearchQuery("");
      setApplicationCurrentPage(1);
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
  const applicationsList = applications.allApplications || [];
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
      <h2 className="text-center">SDPO (Sub-Divisional Police Officer) Dashboard</h2>
      <p className="text-center text-muted">Manage pending and review stage applications</p>

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
            className={`nav-link ${activeTab === "review" ? "active" : ""}`}
            onClick={() => handleTabChange("review")}
          >
            🔍 Review ({applications.review?.length || 0})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "allApplications" ? "active" : ""}`}
            onClick={() => handleTabChange("allApplications")}
          >
            📁 Applications ({applications.allApplications?.length || 0})
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
            📋 Incomplete ({applications.incomplete?.length || 0})
          </button>
        </li>
      </ul>

      {/* Applications Tab - Search and Pagination Controls */}
      {activeTab === "allApplications" && (
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

      {/* Applications Tab - Empty State Messages */}
      {activeTab === "allApplications" && currentList.length === 0 && !error && (
        <p className="text-center mt-4 text-muted">No applications to display</p>
      )}

      {activeTab === "allApplications" &&
        filteredApplicationsList.length === 0 &&
        currentList.length > 0 &&
        !error && (
          <p className="text-center mt-4 text-muted">
            No applications match your search
          </p>
        )}

      {/* Other tabs - Empty State Messages */}

      {/* Approved Applications Tab - Pagination Controls */}
      {activeTab === "approved" && (
        <div className="mt-4 mb-3">
          <div className="d-flex align-items-center gap-3">
            <label htmlFor="itemsPerPageSelectApproved" className="form-label mb-0">
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
              Showing {paginatedApprovedList.length} of {approvedList.length} applications
            </small>
          </div>
        </div>
      )}

      {/* Rejected Applications Tab - Pagination Controls */}
      {activeTab === "rejected" && (
        <div className="mt-4 mb-3">
          <div className="d-flex align-items-center gap-3">
            <label htmlFor="itemsPerPageSelectRejected" className="form-label mb-0">
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
              Showing {paginatedRejectedList.length} of {rejectedList.length} applications
            </small>
          </div>
        </div>
      )}

      {/* Incomplete Applications Tab - Pagination Controls */}
      {activeTab === "incomplete" && (
        <div className="mt-4 mb-3">
          <div className="d-flex align-items-center gap-3">
            <label htmlFor="itemsPerPageSelectIncomplete" className="form-label mb-0">
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
              Showing {paginatedIncompleteList.length} of {incompleteList.length} applications
            </small>
          </div>
        </div>
      )}

      {/* Data Table */}
      {((activeTab === "allApplications" && paginatedApplicationsList.length > 0) ||
        (activeTab === "approved" && paginatedApprovedList.length > 0) ||
        (activeTab === "rejected" && paginatedRejectedList.length > 0) ||
        (activeTab === "incomplete" && paginatedIncompleteList.length > 0) ||
        (activeTab !== "allApplications" && activeTab !== "approved" && activeTab !== "rejected" && activeTab !== "incomplete" && currentList.length > 0)) && (
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
            {(activeTab === "allApplications"
              ? paginatedApplicationsList
              : activeTab === "approved"
              ? paginatedApprovedList
              : activeTab === "rejected"
              ? paginatedRejectedList
              : activeTab === "incomplete"
              ? paginatedIncompleteList
              : currentList
            ).map((app) => (
              <tr key={app.applicationId}>
                <td>{app.applicationId}</td>
                <td>{app.eventTitle}</td>
                <td>{app.permitType}</td>
                <td>
                  <button
                    className="btn btn-sm btn-link p-0"
                    onClick={() => navigate(`/application/${app.applicationId}/timeline`)}
                  >
                    <span className="badge bg-info">{app.status}</span>
                  </button>
                  {app.permitPath && (
                    <span className="badge bg-success ms-2">Permit Available</span>
                  )}
                  {!app.permitPath && app.status === "APPROVED" && (
                    <span className="badge bg-warning text-dark ms-2">
                      Permit Missing
                    </span>
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
                          state: {
                            from: "/authority/sdpo-dashboard",
                            tab: activeTab,
                          },
                        })
                      }
                      title="View full details"
                    >
                      Details
                    </button>
                    {activeTab === "pending" &&
                      app.currentStage === "SDPO_PENDING" && (
                        <button
                          className="btn btn-success"
                          onClick={() =>
                            openActionModal(app.applicationId, "forward-oc")
                          }
                          title="Assign to OC"
                        >
                          OC →
                        </button>
                      )}
                    {activeTab === "review" &&
                      app.currentStage === "SDPO_REVIEW_PENDING" && (
                        <button
                          className="btn btn-primary"
                          onClick={() =>
                            openActionModal(app.applicationId, "forward-sp")
                          }
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

      {/* Pagination for Applications Tab */}
      {activeTab === "allApplications" &&
        filteredApplicationsList.length > applicationItemsPerPage && (
          <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
            <div>
              <small className="text-muted">
                Page {applicationCurrentPage} of {applicationTotalPages} | Total:{" "}
                {filteredApplicationsList.length} applications
              </small>
            </div>
            <nav aria-label="Applications pagination">
              <ul className="pagination mb-0">
                <li
                  className={`page-item ${applicationCurrentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() =>
                      handleApplicationPageChange(applicationCurrentPage - 1)
                    }
                    disabled={applicationCurrentPage === 1}
                  >
                    Previous
                  </button>
                </li>

                {Array.from(
                  { length: applicationTotalPages },
                  (_, i) => i + 1
                )
                  .filter((page) => {
                    const distance = Math.abs(page - applicationCurrentPage);
                    return (
                      distance <= 2 ||
                      page === 1 ||
                      page === applicationTotalPages
                    );
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    return (
                      <React.Fragment key={page}>
                        {prevPage && page - prevPage > 1 && (
                          <li className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        )}
                        <li
                          className={`page-item ${applicationCurrentPage === page ? "active" : ""}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handleApplicationPageChange(page)}
                          >
                            {page}
                          </button>
                        </li>
                      </React.Fragment>
                    );
                  })}

                <li
                  className={`page-item ${applicationCurrentPage === applicationTotalPages ? "disabled" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() =>
                      handleApplicationPageChange(applicationCurrentPage + 1)
                    }
                    disabled={applicationCurrentPage === applicationTotalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}

      {/* Pagination for Approved Applications Tab */}
      {activeTab === "approved" && approvedList.length > approvedItemsPerPage && (
        <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
          <div>
            <small className="text-muted">
              Page {approvedCurrentPage} of {approvedTotalPages} | Total:{" "}
              {approvedList.length} applications
            </small>
          </div>
          <nav aria-label="Approved applications pagination">
            <ul className="pagination mb-0">
              <li
                className={`page-item ${approvedCurrentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() =>
                    handleApprovedPageChange(approvedCurrentPage - 1)
                  }
                  disabled={approvedCurrentPage === 1}
                >
                  Previous
                </button>
              </li>

              {Array.from({ length: approvedTotalPages }, (_, i) => i + 1)
                .filter((page) => {
                  const distance = Math.abs(page - approvedCurrentPage);
                  return (
                    distance <= 2 ||
                    page === 1 ||
                    page === approvedTotalPages
                  );
                })
                .map((page, index, array) => {
                  const prevPage = array[index - 1];
                  return (
                    <React.Fragment key={page}>
                      {prevPage && page - prevPage > 1 && (
                        <li className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      )}
                      <li
                        className={`page-item ${approvedCurrentPage === page ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handleApprovedPageChange(page)}
                        >
                          {page}
                        </button>
                      </li>
                    </React.Fragment>
                  );
                })}

              <li
                className={`page-item ${approvedCurrentPage === approvedTotalPages ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() =>
                    handleApprovedPageChange(approvedCurrentPage + 1)
                  }
                  disabled={approvedCurrentPage === approvedTotalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Pagination for Rejected Applications Tab */}
      {activeTab === "rejected" && rejectedList.length > rejectedItemsPerPage && (
        <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
          <div>
            <small className="text-muted">
              Page {rejectedCurrentPage} of {rejectedTotalPages} | Total:{" "}
              {rejectedList.length} applications
            </small>
          </div>
          <nav aria-label="Rejected applications pagination">
            <ul className="pagination mb-0">
              <li
                className={`page-item ${rejectedCurrentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() =>
                    handleRejectedPageChange(rejectedCurrentPage - 1)
                  }
                  disabled={rejectedCurrentPage === 1}
                >
                  Previous
                </button>
              </li>

              {Array.from({ length: rejectedTotalPages }, (_, i) => i + 1)
                .filter((page) => {
                  const distance = Math.abs(page - rejectedCurrentPage);
                  return (
                    distance <= 2 ||
                    page === 1 ||
                    page === rejectedTotalPages
                  );
                })
                .map((page, index, array) => {
                  const prevPage = array[index - 1];
                  return (
                    <React.Fragment key={page}>
                      {prevPage && page - prevPage > 1 && (
                        <li className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      )}
                      <li
                        className={`page-item ${rejectedCurrentPage === page ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handleRejectedPageChange(page)}
                        >
                          {page}
                        </button>
                      </li>
                    </React.Fragment>
                  );
                })}

              <li
                className={`page-item ${rejectedCurrentPage === rejectedTotalPages ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() =>
                    handleRejectedPageChange(rejectedCurrentPage + 1)
                  }
                  disabled={rejectedCurrentPage === rejectedTotalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Pagination for Incomplete Applications Tab */}
      {activeTab === "incomplete" && incompleteList.length > incompleteItemsPerPage && (
        <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
          <div>
            <small className="text-muted">
              Page {incompleteCurrentPage} of {incompleteTotalPages} | Total:{" "}
              {incompleteList.length} applications
            </small>
          </div>
          <nav aria-label="Incomplete applications pagination">
            <ul className="pagination mb-0">
              <li
                className={`page-item ${incompleteCurrentPage === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() =>
                    handleIncompletePageChange(incompleteCurrentPage - 1)
                  }
                  disabled={incompleteCurrentPage === 1}
                >
                  Previous
                </button>
              </li>

              {Array.from({ length: incompleteTotalPages }, (_, i) => i + 1)
                .filter((page) => {
                  const distance = Math.abs(page - incompleteCurrentPage);
                  return (
                    distance <= 2 ||
                    page === 1 ||
                    page === incompleteTotalPages
                  );
                })
                .map((page, index, array) => {
                  const prevPage = array[index - 1];
                  return (
                    <React.Fragment key={page}>
                      {prevPage && page - prevPage > 1 && (
                        <li className="page-item disabled">
                          <span className="page-link">...</span>
                        </li>
                      )}
                      <li
                        className={`page-item ${incompleteCurrentPage === page ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => handleIncompletePageChange(page)}
                        >
                          {page}
                        </button>
                      </li>
                    </React.Fragment>
                  );
                })}

              <li
                className={`page-item ${incompleteCurrentPage === incompleteTotalPages ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() =>
                    handleIncompletePageChange(incompleteCurrentPage + 1)
                  }
                  disabled={incompleteCurrentPage === incompleteTotalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
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
