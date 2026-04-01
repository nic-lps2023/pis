import React, { useEffect, useState } from "react";
import { getInboxByStage, forwardToSDPO, recommendToDC, viewDocument } from "../../services/AuthorityService";
import { getAllApplications } from "../../services/PermitApplicationService";
import { useNavigate } from "react-router-dom";

const SPDashboard = () => {
  const [applications, setApplications] = useState({
    pending: [],
    review: [],
    all: [],
    approved: [],
    rejected: [],
    incomplete: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [actionRemarks, setActionRemarks] = useState("");
  const [actionType, setActionType] = useState(""); // "forward" or "recommend"
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "review"
  const [searchQuery, setSearchQuery] = useState("");
  const [allPage, setAllPage] = useState(1);
  const [allPerPage, setAllPerPage] = useState(5);
  const [approvedPage, setApprovedPage] = useState(1);
  const [approvedPerPage, setApprovedPerPage] = useState(5);
  const [rejectedPage, setRejectedPage] = useState(1);
  const [rejectedPerPage, setRejectedPerPage] = useState(5);
  const [incompletePage, setIncompletePage] = useState(1);
  const [incompletePerPage, setIncompletePerPage] = useState(5);
  const navigate = useNavigate();

  const getLocationText = (app) =>
    app.fullAddress ||
    [app.venueName, app.locality, app.pincode].filter(Boolean).join(", ") ||
    "N/A";

  const byStatus = (list, status) =>
    (list || []).filter(
      (item) => (item.status || "").toUpperCase() === status.toUpperCase()
    );

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

    // Load both SP_PENDING and SP_REVIEW_PENDING
    Promise.all([
      getInboxByStage("SP_PENDING"),
      getInboxByStage("SP_REVIEW_PENDING"),
      getAllApplications(),
    ])
      .then(([res1, res2, allRes]) => {
        console.log("SP_PENDING:", res1.data);
        console.log("SP_REVIEW_PENDING:", res2.data);
        const allApplications = allRes.data || [];
        setApplications({
          pending: res1.data || [],
          review: res2.data || [],
          all: sortByApplicationIdDesc(allApplications),
          approved: sortByApplicationIdDesc(byStatus(allApplications, "APPROVED")),
          rejected: sortByApplicationIdDesc(byStatus(allApplications, "REJECTED")),
          incomplete: sortByApplicationIdDesc(
            (allApplications || []).filter((a) => {
              const status = (a.status || "").toUpperCase();
              return status !== "APPROVED" && status !== "REJECTED";
            })
          ),
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchQuery("");
    setAllPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setAllPage(1);
  };

  const filterAllApplications = () => {
    if (!searchQuery.trim()) return applications.all;
    const q = searchQuery.toLowerCase();
    return applications.all.filter((app) => {
      const haystack = [
        String(app.applicationId || ''),
        app.eventTitle || '',
        app.permitType || '',
        app.status || '',
        getLocationText(app),
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  };

  const paginate = (items, page, perPage) => {
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const current = Math.min(Math.max(1, page), totalPages);
    const start = (current - 1) * perPage;
    return {
      list: items.slice(start, start + perPage),
      current,
      totalPages,
      total,
      perPage,
    };
  };

  const allItems = filterAllApplications();
  const allPagination = paginate(allItems, allPage, allPerPage);
  const approvedPagination = paginate(applications.approved, approvedPage, approvedPerPage);
  const rejectedPagination = paginate(applications.rejected, rejectedPage, rejectedPerPage);
  const incompletePagination = paginate(applications.incomplete, incompletePage, incompletePerPage);

  const handleItemsPerPageChange = (tab, e) => {
    const value = Number(e.target.value) || 5;
    if (tab === "all") {
      setAllPerPage(value);
      setAllPage(1);
    } else if (tab === "approved") {
      setApprovedPerPage(value);
      setApprovedPage(1);
    } else if (tab === "rejected") {
      setRejectedPerPage(value);
      setRejectedPage(1);
    } else if (tab === "incomplete") {
      setIncompletePerPage(value);
      setIncompletePage(1);
    }
  };
  const handlePageChange = (tab, page) => {
    const value = Math.max(1, page);
    if (tab === "all") {
      setAllPage(value);
    } else if (tab === "approved") {
      setApprovedPage(value);
    } else if (tab === "rejected") {
      setRejectedPage(value);
    } else if (tab === "incomplete") {
      setIncompletePage(value);
    }
  };

  const renderPagination = (paginationInfo) => {
    if (!paginationInfo || paginationInfo.totalPages <= 1) return null;

    const { current, totalPages, total } = paginationInfo;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter((page) => Math.abs(page - current) <= 2 || page === 1 || page === totalPages)
      .reduce((acc, page, idx, arr) => {
        const prev = arr[idx - 1];
        if (prev && page - prev > 1) acc.push('ellipsis-' + page);
        acc.push(page);
        return acc;
      }, []);

    return (
      <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
        <div>
          <small className="text-muted">
            Page {current} of {totalPages} | Total: {total} applications
          </small>
        </div>
        <nav aria-label="All applications pagination">
          <ul className="pagination mb-0">
            <li className={`page-item ${current === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(1)} disabled={current === 1}>
                First
              </button>
            </li>
            <li className={`page-item ${current === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(current - 1)} disabled={current === 1}>
                Previous
              </button>
            </li>
            {pages.map((item) =>
              typeof item === 'string' ? (
                <li className="page-item disabled" key={item}>
                  <span className="page-link">...</span>
                </li>
              ) : (
                <li key={item} className={`page-item ${item === current ? 'active' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(item)}>
                    {item}
                  </button>
                </li>
              )
            )}
            <li className={`page-item ${current === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(current + 1)} disabled={current === totalPages}>
                Next
              </button>
            </li>
            <li className={`page-item ${current === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(totalPages)} disabled={current === totalPages}>
                Last
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  if (loading) return <p className="text-center mt-4">Loading...</p>;

  const currentList =
    activeTab === 'all'
      ? allPagination.list
      : activeTab === 'approved'
      ? approvedPagination.list
      : activeTab === 'rejected'
      ? rejectedPagination.list
      : activeTab === 'incomplete'
      ? incompletePagination.list
      : applications[activeTab] || [];

  const currentPagination =
    activeTab === 'all'
      ? allPagination
      : activeTab === 'approved'
      ? approvedPagination
      : activeTab === 'rejected'
      ? rejectedPagination
      : activeTab === 'incomplete'
      ? incompletePagination
      : null;

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
            className={`nav-link ${activeTab === "all" ? "active" : ""}`}
            onClick={() => handleTabChange("all")}
          >
            📁 All Applications ({applications.all?.length || 0})
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
            ⚠️ Incomplete ({applications.incomplete?.length || 0})
          </button>
        </li>
      </ul>

      {(activeTab === "all" || activeTab === "approved" || activeTab === "rejected" || activeTab === "incomplete") && (
        <div className="mt-4 mb-3">
          {activeTab === "all" && (
            <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
              <input
                type="text"
                className="form-control flex-grow-1"
                placeholder="Search by Application ID, Event Title, Permit Type, Status, or Location..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          )}
          <div className="d-flex align-items-center gap-3">
            <label htmlFor="itemsPerPageSelect" className="form-label mb-0">
              Items per page:
            </label>
            <select
              id="itemsPerPageSelect"
              className="form-select"
              style={{ maxWidth: "150px" }}
              value={
                activeTab === "all"
                  ? allPerPage
                  : activeTab === "approved"
                  ? approvedPerPage
                  : rejectedPerPage
              }
              onChange={(e) => handleItemsPerPageChange(activeTab, e)}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
            <small className="text-muted ms-3">
              Showing {currentList.length} of {currentPagination ? currentPagination.total : currentList.length} applications
            </small>
          </div>
        </div>
      )}

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
                  <button
                    className="btn btn-sm btn-link p-0"
                    onClick={() => navigate(`/application/${app.applicationId}/timeline`)}
                    title="View application timeline"
                    style={{ textDecoration: 'none' }}
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

      {(activeTab === "all" && renderPagination(allPagination)) ||
        (activeTab === "approved" && renderPagination(approvedPagination)) ||
        (activeTab === "rejected" && renderPagination(rejectedPagination)) ||
        (activeTab === "incomplete" && renderPagination(incompletePagination))}

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
