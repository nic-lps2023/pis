import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserId } from "../services/AuthService";
import { createPermitApplicationWithPdf } from "../services/PermitApplicationService";
import {
  getAllDistricts,
  getPoliceStationsBySubdivisionId,
  getSubdivisionsByDistrictId,
} from "../services/LocationService";

const PermitApplicationComponent = () => {
  const [eventTitle, setEventTitle] = useState("");
  const [purpose, setPurpose] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [permitType, setPermitType] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [subdivisionId, setSubdivisionId] = useState("");
  const [policeStationId, setPoliceStationId] = useState("");
  const [venueName, setVenueName] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [locality, setLocality] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [file, setFile] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [subdivisions, setSubdivisions] = useState([]);
  const [policeStations, setPoliceStations] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    getAllDistricts()
      .then((res) => setDistricts(res.data || []))
      .catch((err) => console.error("Error loading districts:", err));
  }, []);

  useEffect(() => {
    if (!districtId) {
      setSubdivisions([]);
      setSubdivisionId("");
      setPoliceStations([]);
      setPoliceStationId("");
      return;
    }

    getSubdivisionsByDistrictId(districtId)
      .then((res) => {
        setSubdivisions(res.data || []);
        setSubdivisionId("");
        setPoliceStations([]);
        setPoliceStationId("");
      })
      .catch((err) => {
        console.error("Error loading subdivisions:", err);
        setSubdivisions([]);
      });
  }, [districtId]);

  useEffect(() => {
    if (!subdivisionId) {
      setPoliceStations([]);
      setPoliceStationId("");
      return;
    }

    getPoliceStationsBySubdivisionId(subdivisionId)
      .then((res) => {
        setPoliceStations(res.data || []);
        setPoliceStationId("");
      })
      .catch((err) => {
        console.error("Error loading police stations:", err);
        setPoliceStations([]);
      });
  }, [subdivisionId]);

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

    if (
      !eventTitle ||
      !purpose ||
      !startDateTime ||
      !endDateTime ||
      !permitType ||
      !districtId ||
      !subdivisionId ||
      !policeStationId ||
      !venueName ||
      !fullAddress ||
      !locality ||
      !pincode
    ) {
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
      districtId: parseInt(districtId),
      subdivisionId: parseInt(subdivisionId),
      policeStationId: parseInt(policeStationId),
      venueName,
      fullAddress,
      locality,
      landmark,
      pincode,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
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

  const showEventOnMap = () => {
    const query =
      latitude && longitude
        ? `${latitude},${longitude}`
        : [venueName, fullAddress, locality, pincode].filter(Boolean).join(", ");

    if (!query.trim()) {
      alert("Please enter venue/address first.");
      return;
    }

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
      "_blank"
    );
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
              <label className="form-label">District:</label>
              <select
                className="form-control"
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
              >
                <option value="">-- Select District --</option>
                {districts.map((district) => (
                  <option key={district.districtId} value={district.districtId}>
                    {district.districtName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group mb-2">
              <label className="form-label">Sub Division:</label>
              <select
                className="form-control"
                value={subdivisionId}
                onChange={(e) => setSubdivisionId(e.target.value)}
                disabled={!districtId}
              >
                <option value="">-- Select Sub Division --</option>
                {subdivisions.map((subdivision) => (
                  <option
                    key={subdivision.subdivisionId}
                    value={subdivision.subdivisionId}
                  >
                    {subdivision.subdivisionName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group mb-2">
              <label className="form-label">Police Station:</label>
              <select
                className="form-control"
                value={policeStationId}
                onChange={(e) => setPoliceStationId(e.target.value)}
                disabled={!subdivisionId}
              >
                <option value="">-- Select Police Station --</option>
                {policeStations.map((station) => (
                  <option
                    key={station.policeStationId}
                    value={station.policeStationId}
                  >
                    {station.policeStationName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group mb-2">
              <label className="form-label">Venue Name:</label>
              <input
                type="text"
                className="form-control"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="Enter venue name"
              />
            </div>

            <div className="form-group mb-2">
              <label className="form-label">Detailed Address:</label>
              <textarea
                className="form-control"
                rows="3"
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                placeholder="Enter complete event address"
              ></textarea>
            </div>

            <div className="form-group mb-2">
              <label className="form-label">Locality:</label>
              <input
                type="text"
                className="form-control"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="Enter locality"
              />
            </div>

            <div className="form-group mb-2">
              <label className="form-label">Landmark (Optional):</label>
              <input
                type="text"
                className="form-control"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Enter landmark (optional)"
              />
            </div>

            <div className="form-group mb-2">
              <label className="form-label">Pincode:</label>
              <input
                type="text"
                className="form-control"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Enter pincode"
              />
            </div>

            <div className="row">
              <div className="col-md-6 form-group mb-2">
                <label className="form-label">Latitude (Optional):</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="e.g. 24.8170"
                />
              </div>
              <div className="col-md-6 form-group mb-2">
                <label className="form-label">Longitude (Optional):</label>
                <input
                  type="number"
                  step="any"
                  className="form-control"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="e.g. 93.9368"
                />
              </div>
            </div>

            <div className="form-group mb-3">
              <button type="button" className="btn btn-outline-primary" onClick={showEventOnMap}>
                Show Event on Map
              </button>
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
