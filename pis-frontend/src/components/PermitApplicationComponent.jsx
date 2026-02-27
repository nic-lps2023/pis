import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserId } from "../services/AuthService";
import { createPermitApplicationWithPdf } from "../services/PermitApplicationService";

const PermitApplicationComponent = () => {
  const [eventTitle, setEventTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [permitType, setPermitType] = useState("");
  const [locationTag, setLocationTag] = useState("");
  const [file, setFile] = useState(null);

  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    // Validate PDF only
    if (selectedFile.type !== "application/pdf") {
      alert("Only PDF files are allowed!");
      e.target.value = null;
      return;
    }

    setFile(selectedFile);
  };

  const savePermitApplication = (e) => {
    e.preventDefault();

    if (!eventTitle || !purpose || !startDateTime || !endDateTime || !permitType || !locationTag) {
      alert("All fields are required!");
      return;
    }

    if (!file) {
      alert("Please upload PDF document!");
      return;
    }

    // userId from AuthService
    const userId = getUserId();

    if (!userId) {
      alert("User not logged in!");
      navigate("/login");
      return;
    }

    const applicationDto = {
      eventTitle,
      purpose,
      startDateTime,
      endDateTime,
      permitType,
      locationTag,
      userId: parseInt(userId),
    };

    createPermitApplicationWithPdf(applicationDto, file)
      .then((response) => {
        console.log("Permit Application Saved:", response.data);
        alert("Permit Application Submitted Successfully!");
        navigate("/my-applications");
      })
      .catch((error) => {
        console.error("Error submitting permit application:", error);
        alert("Error while submitting permit application!");
      });
  };

  return (
    <div className="container mt-4">
      <div className="card col-md-8 offset-md-2">
        <h3 className="text-center mt-3">Permit Application Form</h3>

        <div className="card-body">
          <form onSubmit={savePermitApplication}>

            <div className="form-group mb-2">
              <label className="form-label">Event Title:</label>
              <input
                type="text"
                className="form-control"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Enter Event Title"
              />
            </div>

            <div className="form-group mb-2">
              <label className="form-label">Purpose of Event:</label>
              <textarea
                className="form-control"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Enter purpose"
              ></textarea>
            </div>

            <div className="form-group mb-2">
              <label className="form-label">Start Date & Time:</label>
              <input
                type="datetime-local"
                className="form-control"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
              />
            </div>

            <div className="form-group mb-2">
              <label className="form-label">End Date & Time:</label>
              <input
                type="datetime-local"
                className="form-control"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
              />
            </div>

            <div className="form-group mb-2">
              <label className="form-label">Permit Type:</label>
              <select
                className="form-control"
                value={permitType}
                onChange={(e) => setPermitType(e.target.value)}
              >
                <option value="">-- Select Permit Type --</option>
                <option value="Public gatherings">Public gatherings</option>
                <option value="Rallies">Rallies</option>
                <option value="Use of loudspeakers">Use of loudspeakers</option>
                <option value="Temporary structures">Temporary structures</option>
                <option value="Concert">Concert</option>
                <option value="Flying drone">Flying drone</option>
                <option value="Processions">Processions</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div className="form-group mb-2">
              <label className="form-label">Location Tag:</label>
              <input
                type="text"
                className="form-control"
                value={locationTag}
                onChange={(e) => setLocationTag(e.target.value)}
                placeholder="Enter location"
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Upload Document (PDF only):</label>
              <input
                type="file"
                className="form-control"
                accept="application/pdf"
                onChange={handleFileChange}
              />
            </div>

            <button type="submit" className="btn btn-success">
              Submit Application
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default PermitApplicationComponent;
