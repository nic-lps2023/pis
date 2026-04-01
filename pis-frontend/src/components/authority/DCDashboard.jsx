import React, { useEffect, useState } from "react";
import { getInboxByStage, viewDocument } from "../../services/AuthorityService";
import { getAllApplications } from "../../services/PermitApplicationService";
import { useNavigate } from "react-router-dom";

const DCDashboard = () => {
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
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [approvedCurrentPage, setApprovedCurrentPage] = useState(1);
  const [approvedItemsPerPage, setApprovedItemsPerPage] = useState(5);
  const [rejectedCurrentPage, setRejectedCurrentPage] = useState(1);
  const [rejectedItemsPerPage, setRejectedItemsPerPage] = useState(5);
  const [incompleteCurrentPage, setIncompleteCurrentPage] = useState(1);
  const [incompleteItemsPerPage, setIncompleteItemsPerPage] = useState(5);
  const navigate = useNavigate();

  const getLocationText = (app) =>
    app.fullAddress ||
    [app.venueName, app.locality, app.pincode].filter(Boolean).join(", ") ||
    "N/A";

  const byStatus = (list, status) =>
    (list || []).filter(
      (item) => (item.status || "").toUpperCase() === status.toUpperCase()
    );

  const getIncompleteApplications = (list) =>
    (list || []).filter((item) => {
      const status = (item.status || "").toUpperCase();
      return status !== "APPROVED" && status !== "REJECTED";
    });

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
      getInboxByStage("DC_PENDING"),
      getInboxByStage("DC_FINAL_PENDING"),
      getAllApplications(),
    ])
      .then(([pendingRes, reviewRes, allRes]) => {
        console.log("DC_PENDING:", pendingRes.data);
        console.log("DC_FINAL_PENDING:", reviewRes.data);
        const allApplications = allRes.data || [];
        setApplications({
          all: sortByApplicationIdDesc(allApplications),
          pending: pendingRes.data || [],
          review: reviewRes.data || [],
          approved: sortByApplicationIdDesc(byStatus(allApplications, "APPROVED")),
          rejected: sortByApplicationIdDesc(byStatus(allApplications, "REJECTED")),
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

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchQuery("");
    setCurrentPage(1);
    setApprovedCurrentPage(1);
    setRejectedCurrentPage(1);
    setIncompleteCurrentPage(1);
  };

  const filterApplications = (list) => {
    if (!searchQuery.trim()) return list;
    
    const query = searchQuery.toLowerCase();
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

  const currentList = applications[activeTab] || [];
  const filteredList = filterApplications(currentList);
  
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedList = filteredList.slice(startIndex, startIndex + itemsPerPage);

  // Pagination for Approved Applications tab
  const approvedList = applications.approved || [];
  const approvedTotalPages = Math.ceil(approvedList.length / approvedItemsPerPage);
  const approvedStartIndex = (approvedCurrentPage - 1) * approvedItemsPerPage;
  const paginatedApprovedList = approvedList.slice(approvedStartIndex, approvedStartIndex + approvedItemsPerPage);

  // Pagination for Rejected Applications tab
  const rejectedList = applications.rejected || [];
  const rejectedTotalPages = Math.ceil(rejectedList.length / rejectedItemsPerPage);
  const rejectedStartIndex = (rejectedCurrentPage - 1) * rejectedItemsPerPage;
  const paginatedRejectedList = rejectedList.slice(rejectedStartIndex, rejectedStartIndex + rejectedItemsPerPage);

  // Pagination for Incomplete Applications tab
  const incompleteList = applications.incomplete || [];
  const incompleteTotalPages = Math.ceil(incompleteList.length / incompleteItemsPerPage);
  const incompleteStartIndex = (incompleteCurrentPage - 1) * incompleteItemsPerPage;
  const paginatedIncompleteList = incompleteList.slice(incompleteStartIndex, incompleteStartIndex + incompleteItemsPerPage);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value, 10) || 5;
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleApprovedPageChange = (pageNumber) => {
    setApprovedCurrentPage(pageNumber);
  };

  const handleApprovedItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value, 10) || 5;
    setApprovedItemsPerPage(value);
    setApprovedCurrentPage(1);
  };

  const handleIncompletePageChange = (pageNumber) => {
    setIncompleteCurrentPage(pageNumber);
  };

  const handleIncompleteItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value, 10) || 5;
    setIncompleteItemsPerPage(value);
    setIncompleteCurrentPage(1);
  };

  const handleRejectedPageChange = (pageNumber) => {
    setRejectedCurrentPage(pageNumber);
  };

  const handleRejectedItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value, 10) || 5;
    setRejectedItemsPerPage(value);
    setRejectedCurrentPage(1);
  };

  if (loading) return <p className="text-center mt-4">Loading...</p>;

  return (
    <div className="container mt-4">
      <h2 className="text-center">Deputy Commissioner (DC) Dashboard</h2>
      <p className="text-center text-muted">Manage initial and final stage reviews</p>

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
            📋 Incomplete ({applications.incomplete?.length || 0})
          </button>
        </li>
      </ul>

      {activeTab === "all" && (
        <div className="mt-4 mb-3">
          <div className="d-flex align-items-center gap-3 mb-3">
            <input
              type="text"
              className="form-control flex-grow-1"
              placeholder="Search by Application ID, Event Title, Permit Type, Status, or Location..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <div className="d-flex align-items-center gap-3">
            <label htmlFor="itemsPerPageSelectAll" className="form-label mb-0">
              Items per page:
            </label>
            <select
              id="itemsPerPageSelectAll"
              className="form-select"
              style={{ maxWidth: "150px" }}
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
            </select>
            <small className="text-muted ms-3">
              Showing {paginatedList.length} of {filteredList.length} applications
            </small>
          </div>
        </div>
      )}

      {currentList.length === 0 && !error && (
        <p className="text-center mt-4 text-muted">No applications to display</p>
      )}

      {filteredList.length === 0 && currentList.length > 0 && activeTab === "all" && !error && (
        <p className="text-center mt-4 text-muted">No applications match your search</p>
      )}

      {activeTab === "approved" && (
        <div className="mt-4 mb-3">
          <div className="d-flex align-items-center gap-3">
            <label htmlFor="itemsPerPageSelect" className="form-label mb-0">
              Items per page:
            </label>
            <select
              id="itemsPerPageSelect"
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

      {((activeTab === "approved" ? paginatedApprovedList.length > 0 : activeTab === "rejected" ? paginatedRejectedList.length > 0 : activeTab === "incomplete" ? paginatedIncompleteList.length > 0 : paginatedList.length > 0)) && (
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
            {(activeTab === "approved" ? paginatedApprovedList : activeTab === "rejected" ? paginatedRejectedList : activeTab === "incomplete" ? paginatedIncompleteList : paginatedList).map((app) => (
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
                  <button
                    className="btn btn-sm btn-info"
                    onClick={() =>
                      navigate(`/authority/application/${app.applicationId}`, {
                        state: { from: "/authority/dc-dashboard", tab: activeTab },
                      })
                    }
                    title="View full details"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {activeTab === "all" && filteredList.length > itemsPerPage && (
        <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
          <div>
            <small className="text-muted">
              Page {currentPage} of {totalPages} | Total: {filteredList.length} applications
            </small>
          </div>
          <nav aria-label="All applications pagination">
            <ul className="pagination mb-0">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  const distance = Math.abs(page - currentPage);
                  return distance <= 2 || page === 1 || page === totalPages;
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
                      <li className={`page-item ${currentPage === page ? "active" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      </li>
                    </React.Fragment>
                  );
                })}

              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {activeTab === "approved" && approvedList.length > approvedItemsPerPage && (
        <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
          <div>
            <small className="text-muted">
              Page {approvedCurrentPage} of {approvedTotalPages} | Total: {approvedList.length} applications
            </small>
          </div>
          <nav aria-label="Approved applications pagination">
            <ul className="pagination mb-0">
              <li className={`page-item ${approvedCurrentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handleApprovedPageChange(1)}
                  disabled={approvedCurrentPage === 1}
                >
                  Previous
                </button>
              </li>

              {Array.from({ length: approvedTotalPages }, (_, i) => i + 1)
                .filter((page) => {
                  const distance = Math.abs(page - approvedCurrentPage);
                  return distance <= 2 || page === 1 || page === approvedTotalPages;
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
                      <li className={`page-item ${approvedCurrentPage === page ? "active" : ""}`}>
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

              <li className={`page-item ${approvedCurrentPage === approvedTotalPages ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handleApprovedPageChange(approvedCurrentPage + 1)}
                  disabled={approvedCurrentPage === approvedTotalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {activeTab === "rejected" && rejectedList.length > rejectedItemsPerPage && (
        <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
          <div>
            <small className="text-muted">
              Page {rejectedCurrentPage} of {rejectedTotalPages} | Total: {rejectedList.length} applications
            </small>
          </div>
          <nav aria-label="Rejected applications pagination">
            <ul className="pagination mb-0">
              <li className={`page-item ${rejectedCurrentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handleRejectedPageChange(rejectedCurrentPage - 1)}
                  disabled={rejectedCurrentPage === 1}
                >
                  Previous
                </button>
              </li>

              {Array.from({ length: rejectedTotalPages }, (_, i) => i + 1)
                .filter((page) => {
                  const distance = Math.abs(page - rejectedCurrentPage);
                  return distance <= 2 || page === 1 || page === rejectedTotalPages;
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
                      <li className={`page-item ${rejectedCurrentPage === page ? "active" : ""}`}>
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

              <li className={`page-item ${rejectedCurrentPage === rejectedTotalPages ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handleRejectedPageChange(rejectedCurrentPage + 1)}
                  disabled={rejectedCurrentPage === rejectedTotalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {activeTab === "incomplete" && incompleteList.length > incompleteItemsPerPage && (
        <div className="d-flex justify-content-between align-items-center mt-4 mb-4">
          <div>
            <small className="text-muted">
              Page {incompleteCurrentPage} of {incompleteTotalPages} | Total: {incompleteList.length} applications
            </small>
          </div>
          <nav aria-label="Incomplete applications pagination">
            <ul className="pagination mb-0">
              <li className={`page-item ${incompleteCurrentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handleIncompletePageChange(incompleteCurrentPage - 1)}
                  disabled={incompleteCurrentPage === 1}
                >
                  Previous
                </button>
              </li>

              {Array.from({ length: incompleteTotalPages }, (_, i) => i + 1)
                .filter((page) => {
                  const distance = Math.abs(page - incompleteCurrentPage);
                  return distance <= 2 || page === 1 || page === incompleteTotalPages;
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
                      <li className={`page-item ${incompleteCurrentPage === page ? "active" : ""}`}>
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

              <li className={`page-item ${incompleteCurrentPage === incompleteTotalPages ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handleIncompletePageChange(incompleteCurrentPage + 1)}
                  disabled={incompleteCurrentPage === incompleteTotalPages}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}


    </div>
  );
};

export default DCDashboard;
