import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getApplicationById } from "../services/PermitApplicationService";
import { getAuthorityHistory } from "../services/AuthorityService";

const formatDateTime = (value) => {
  if (!value) return "N/A";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;

  return parsedDate.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

const ApplicationTimelineComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    const appPromise = getApplicationById(id);
    const historyPromise = getAuthorityHistory(id);

    Promise.all([appPromise, historyPromise])
      .then(([appRes, historyRes]) => {
        setApplication(appRes.data);
        setActionHistory(historyRes.data || []);
      })
      .catch((err) => {
        setError("Could not load application timeline data.");
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!application) return;

    const sortedHistory = [...actionHistory].sort(
      (a, b) => new Date(a.actionAt).getTime() - new Date(b.actionAt).getTime()
    );

    const builtTimeline = [];

    // Add submission event first
    builtTimeline.push({
      status: "SUBMITTED",
      label: "Application submitted successfully",
      actorRole: "Applicant",
      actorName: application.applicantFullName || "Applicant",
      date: application.submissionDate || application.createdDate || application.applicationDate || new Date(),
      icon: "✅",
      iconColor: "#198754",
    });

    // Map history records to timeline events
    sortedHistory.forEach((event) => {
      builtTimeline.push({
        status: event.newStatus || event.actionType || "UPDATE",
        label: event.message || `Action: ${event.actionType}`,
        actorRole: event.authorityRole || "System",
        actorName: event.actorFullName || event.authorityRole || "System",
        date: event.actionAt || new Date(),
        icon: event.newStatus === "APPROVED" ? "✅" : event.newStatus === "REJECTED" ? "❌" : "⏱️",
        iconColor:
          event.newStatus === "APPROVED"
            ? "#198754"
            : event.newStatus === "REJECTED"
            ? "#dc3545"
            : "#0d6efd",
      });
    });

    setTimeline(builtTimeline);
  }, [application, actionHistory]);

  if (loading) {
    return (
      <div className="container mt-4">
        <h2>Application Timeline</h2>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <h2>Application Timeline</h2>
        <div className="alert alert-warning">{error}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Application Timeline</h2>
        <button className="btn btn-outline-primary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      <div className="row">
        <div className="col-md-4">
          <div className="card mb-3">
            <div className="card-header">Application Information</div>
            <div className="card-body">
              <p><b>Application ID:</b> {application.applicationId}</p>
              <p><b>Event Title:</b> {application.eventTitle || "N/A"}</p>
              <p><b>Permit Type:</b> {application.permitType || "N/A"}</p>
              <p><b>Status:</b> {application.status || "N/A"}</p>
              <p><b>Submission Date:</b> {formatDateTime(application.submissionDate)}</p>
              <p><b>Applicant:</b> {application.applicantFullName || "N/A"}</p>
              <p><b>District:</b> {application.districtName || "N/A"}</p>
              <p><b>Police Station:</b> {application.policeStationName || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className="card">
            <div className="card-header">Application Timeline</div>
            <div className="card-body"> 
              <div style={{ borderLeft: "3px solid #dee2e6", paddingLeft: "18px" }}>
                {timeline.map((event, index) => (
                  <div key={index} style={{ marginBottom: "1.5rem", position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        left: "-33px",
                        top: "4px",
                        width: "26px",
                        height: "26px",
                        borderRadius: "50%",
                        backgroundColor: "white",
                        border: `2px solid ${event.iconColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span>{event.icon}</span>
                    </div>
                    <h5 style={{ marginBottom: "0.25rem" }}>{event.status}</h5>
                    <p style={{ marginBottom: "0.25rem" }}><small>{formatDateTime(event.date)}</small></p>
                    <p style={{ marginBottom: "0.25rem" }}>
                      <small>
                        By: {event.actorName && event.actorName !== event.actorRole ? event.actorName : event.actorRole}
                        {event.actorName && event.actorName !== event.actorRole ? ` (${event.actorRole})` : ""}
                      </small>
                    </p>
                    <p style={{ marginBottom: 0 }}>{event.label}</p>
                  </div>
                ))}
                {timeline.length === 0 && (
                  <div className="alert alert-secondary">No timeline events available.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationTimelineComponent;
