import React, { useEffect, useState } from "react";
import { getUserId } from "../services/AuthService";
import { getApplicationsByUserId } from "../services/PermitApplicationService";

const MyApplicationsComponent = () => {
  const [applications, setApplications] = useState([]);

  const userId = getUserId();

  useEffect(() => {
    if (!userId) {
      alert("User not logged in!");
      return;
    }

    getApplicationsByUserId(userId)
      .then((response) => {
        setApplications(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [userId]);

  return (
    <div className="container">
      <h2 className="text-center">My Permit Applications</h2>

      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Application ID</th>
            <th>Event Title</th>
            <th>Permit Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {applications.map((app) => (
            <tr key={app.applicationId}>
              <td>{app.applicationId}</td>
              <td>{app.eventTitle}</td>
              <td>{app.permitType}</td>
              <td>{app.startDateTime}</td>
              <td>{app.endDateTime}</td>
              <td>
                <b>{app.status}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-center mt-3">
        <a className="btn btn-success" href="/permit-application">
          Apply New Permit
        </a>
      </div>
    </div>
  );
};

export default MyApplicationsComponent;
