import React, { useEffect, useState } from "react";
import { deleteUser, listUsers } from "../services/UserService";
import { useNavigate } from "react-router-dom";
import { getRoleId } from "../services/AuthService";

const ListUserComponent = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [pageSizeInput, setPageSizeInput] = useState("10");

  const navigator = useNavigate();
  const isAdmin = String(getRoleId()) === "1";

  useEffect(() => {
    getAllUsers();
  }, []);

  function getAllUsers() {
    listUsers()
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  function updateUser(userId) {
    navigator(`/edit-register-user/${userId}`);
  }

  function removeUser(userId) {
    deleteUser(userId)
      .then(() => {
        getAllUsers();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleSelectPageSizeChange = (event) => {
    const nextValue = Number(event.target.value);
    if (!Number.isNaN(nextValue) && nextValue > 0) {
      setUsersPerPage(nextValue);
      setPageSizeInput(String(nextValue));
      setCurrentPage(1);
    }
  };

  const applyCustomPageSize = () => {
    const nextValue = Number(pageSizeInput);
    if (!Number.isNaN(nextValue) && Number.isInteger(nextValue) && nextValue > 0) {
      setUsersPerPage(nextValue);
      setCurrentPage(1);
    } else {
      setPageSizeInput(String(usersPerPage));
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return true;
    }

    const searchableFields = [
      user.userId,
      user.fullName,
      user.email,
      user.phoneNumber,
      user.gender,
      user.address,
      user.roleName,
      user.districtName,
      user.subdivisionName,
      user.policeStationName,
      user.isActive ? "yes" : "no",
      user.isVerified ? "yes" : "no",
    ];

    return searchableFields.some((field) =>
      String(field || "").toLowerCase().includes(query)
    );
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aId = Number(a.userId);
    const bId = Number(b.userId);

    if (Number.isNaN(aId) || Number.isNaN(bId)) {
      return String(a.userId).localeCompare(String(b.userId), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    }

    return aId - bId;
  });

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / usersPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, startIndex + usersPerPage);

  return (
    <div className="container">
      <h2 className="text-center">List of Users</h2>

      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search by ID, name, email, phone, role, district, station..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <label className="mb-0" htmlFor="page-size-select">Users per page:</label>
        <select
          id="page-size-select"
          className="form-select"
          style={{ width: "auto" }}
          value={usersPerPage}
          onChange={handleSelectPageSizeChange}
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <label className="mb-0" htmlFor="page-size-input">Or enter:</label>
        <input
          id="page-size-input"
          type="number"
          min="1"
          className="form-control"
          style={{ width: "110px" }}
          value={pageSizeInput}
          onChange={(e) => setPageSizeInput(e.target.value)}
          onBlur={applyCustomPageSize}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              applyCustomPageSize();
            }
          }}
        />
      </div>

      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>User Id</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Gender</th>
            <th>Address</th>
            <th>Role</th>
            <th>District</th>
            <th>Sub Division</th>
            <th>Police Station</th>
            <th>Active</th>
            <th>Verified</th>
            <th colSpan="2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {paginatedUsers.map((user) => (
            <tr key={user.userId}>
              <td>{user.userId}</td>
              <td>{user.fullName}</td>
              <td>{user.email}</td>
              <td>{user.phoneNumber}</td>
              <td>{user.gender}</td>
              <td>{user.address}</td>
              <td>{user.roleName}</td>
              <td>{user.districtName || "-"}</td>
              <td>{user.subdivisionName || "-"}</td>
              <td>{user.policeStationName || "-"}</td>
              <td>{user.isActive ? "YES" : "NO"}</td>
              <td>{user.isVerified ? "YES" : "NO"}</td>

              <td>
                {isAdmin && (
                  <button
                    className="btn btn-info"
                    onClick={() => updateUser(user.userId)}
                  >
                    Update
                  </button>
                )}
              </td>

              <td>
                {isAdmin && (
                  <button
                    className="btn btn-danger"
                    onClick={() => removeUser(user.userId)}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}

          {sortedUsers.length === 0 && (
            <tr>
              <td colSpan="14" className="text-center">
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {sortedUsers.length > 0 && (
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
          <div>
            Showing {startIndex + 1} to {Math.min(startIndex + usersPerPage, sortedUsers.length)} of {sortedUsers.length} users
          </div>

          <div className="btn-group" role="group" aria-label="Pagination controls">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            >
              Previous
            </button>
            <button type="button" className="btn btn-outline-secondary" disabled>
              Page {currentPage} of {totalPages}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListUserComponent;
