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
  const MAX_FILE_SIZE_BYTES = 300 * 1024;
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
  const [errors, setErrors] = useState({
    eventTitle: "",
    purpose: "",
    startDateTime: "",
    endDateTime: "",
    permitType: "",
    districtId: "",
    subdivisionId: "",
    policeStationId: "",
    venueName: "",
    fullAddress: "",
    locality: "",
    pincode: "",
    file: "",
  });

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
      setFile(null);
      setErrors((prev) => ({ ...prev, file: "Only PDF files are allowed" }));
      e.target.value = null;
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      setErrors((prev) => ({
        ...prev,
        file: "PDF size must be 300 KB or less",
      }));
      e.target.value = null;
      return;
    }

    setFile(selectedFile);
    setErrors((prev) => ({ ...prev, file: "" }));
  };

  const validateForm = () => {
    let valid = true;
    const nextErrors = {
      eventTitle: "",
      purpose: "",
      startDateTime: "",
      endDateTime: "",
      permitType: "",
      districtId: "",
      subdivisionId: "",
      policeStationId: "",
      venueName: "",
      fullAddress: "",
      locality: "",
      pincode: "",
      file: "",
    };

    if (!eventTitle.trim()) {
      nextErrors.eventTitle = "Event Title is required";
      valid = false;
    }
    if (!purpose.trim()) {
      nextErrors.purpose = "Purpose of Event is required";
      valid = false;
    }
    if (!startDateTime) {
      nextErrors.startDateTime = "Start Date & Time is required";
      valid = false;
    }
    if (!endDateTime) {
      nextErrors.endDateTime = "End Date & Time is required";
      valid = false;
    }
    if (!permitType) {
      nextErrors.permitType = "Permit Type is required";
      valid = false;
    }
    if (!districtId) {
      nextErrors.districtId = "District is required";
      valid = false;
    }
    if (!subdivisionId) {
      nextErrors.subdivisionId = "Sub Division is required";
      valid = false;
    }
    if (!policeStationId) {
      nextErrors.policeStationId = "Police Station is required";
      valid = false;
    }
    if (!venueName.trim()) {
      nextErrors.venueName = "Venue Name is required";
      valid = false;
    }
    if (!fullAddress.trim()) {
      nextErrors.fullAddress = "Detailed Address is required";
      valid = false;
    }
    if (!locality.trim()) {
      nextErrors.locality = "Locality is required";
      valid = false;
    }
    if (!pincode.trim()) {
      nextErrors.pincode = "Pincode is required";
      valid = false;
    }
    if (!file) {
      nextErrors.file = "Please upload PDF document";
      valid = false;
    } else if (file.size > MAX_FILE_SIZE_BYTES) {
      nextErrors.file = "PDF size must be 300 KB or less";
      valid = false;
    }

    setErrors(nextErrors);
    return valid;
  };

  const savePermitApplication = (e) => {
    e.preventDefault();

    if (!validateForm()) {
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
              <label className="form-label">
                Event Title:<span className="text-danger ms-1">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.eventTitle ? "is-invalid" : ""}`}
                value={eventTitle}
                onChange={(e) => {
                  setEventTitle(e.target.value);
                  setErrors((prev) => ({ ...prev, eventTitle: "" }));
                }}
                placeholder="Enter Event Title"
              />
              {errors.eventTitle && (
                <div className="invalid-feedback">{errors.eventTitle}</div>
              )}
            </div>

            <div className="form-group mb-2">
              <label className="form-label">
                Purpose of Event:<span className="text-danger ms-1">*</span>
              </label>
              <textarea
                className={`form-control ${errors.purpose ? "is-invalid" : ""}`}
                value={purpose}
                onChange={(e) => {
                  setPurpose(e.target.value);
                  setErrors((prev) => ({ ...prev, purpose: "" }));
                }}
                placeholder="Enter purpose"
              ></textarea>
              {errors.purpose && (
                <div className="invalid-feedback">{errors.purpose}</div>
              )}
            </div>

            <div className="form-group mb-2">
              <label className="form-label">
                Start Date & Time:<span className="text-danger ms-1">*</span>
              </label>
              <input
                type="datetime-local"
                className={`form-control ${errors.startDateTime ? "is-invalid" : ""}`}
                value={startDateTime}
                onChange={(e) => {
                  setStartDateTime(e.target.value);
                  setErrors((prev) => ({ ...prev, startDateTime: "" }));
                }}
              />
              {errors.startDateTime && (
                <div className="invalid-feedback">{errors.startDateTime}</div>
              )}
            </div>

            <div className="form-group mb-2">
              <label className="form-label">
                End Date & Time:<span className="text-danger ms-1">*</span>
              </label>
              <input
                type="datetime-local"
                className={`form-control ${errors.endDateTime ? "is-invalid" : ""}`}
                value={endDateTime}
                onChange={(e) => {
                  setEndDateTime(e.target.value);
                  setErrors((prev) => ({ ...prev, endDateTime: "" }));
                }}
              />
              {errors.endDateTime && (
                <div className="invalid-feedback">{errors.endDateTime}</div>
              )}
            </div>

            <div className="form-group mb-2">
              <label className="form-label">
                Permit Type:<span className="text-danger ms-1">*</span>
              </label>
              <select
                className={`form-control ${errors.permitType ? "is-invalid" : ""}`}
                value={permitType}
                onChange={(e) => {
                  setPermitType(e.target.value);
                  setErrors((prev) => ({ ...prev, permitType: "" }));
                }}
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
              {errors.permitType && (
                <div className="invalid-feedback">{errors.permitType}</div>
              )}
            </div>

            <div className="form-group mb-2">
              <label className="form-label">
                District:<span className="text-danger ms-1">*</span>
              </label>
              <select
                className={`form-control ${errors.districtId ? "is-invalid" : ""}`}
                value={districtId}
                onChange={(e) => {
                  setDistrictId(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    districtId: "",
                    subdivisionId: "",
                    policeStationId: "",
                  }));
                }}
              >
                <option value="">-- Select District --</option>
                {districts.map((district) => (
                  <option key={district.districtId} value={district.districtId}>
                    {district.districtName}
                  </option>
                ))}
              </select>
              {errors.districtId && (
                <div className="invalid-feedback">{errors.districtId}</div>
              )}
            </div>

            <div className="form-group mb-2">
              <label className="form-label">
                Sub Division:<span className="text-danger ms-1">*</span>
              </label>
              <select
                className={`form-control ${errors.subdivisionId ? "is-invalid" : ""}`}
                value={subdivisionId}
                onChange={(e) => {
                  setSubdivisionId(e.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    subdivisionId: "",
                    policeStationId: "",
                  }));
                }}
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
              {errors.subdivisionId && (
                <div className="invalid-feedback">{errors.subdivisionId}</div>
              )}
            </div>

            <div className="form-group mb-2">
              <label className="form-label">
                Police Station:<span className="text-danger ms-1">*</span>
              </label>
              <select
                className={`form-control ${errors.policeStationId ? "is-invalid" : ""}`}
                value={policeStationId}
                onChange={(e) => {
                  setPoliceStationId(e.target.value);
                  setErrors((prev) => ({ ...prev, policeStationId: "" }));
                }}
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
              {errors.policeStationId && (
                <div className="invalid-feedback">{errors.policeStationId}</div>
              )}
            </div>

            <div className="form-group mb-2">
              <label className="form-label">
                Venue Name:<span className="text-danger ms-1">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.venueName ? "is-invalid" : ""}`}
                value={venueName}
                onChange={(e) => {
                  setVenueName(e.target.value);
                  setErrors((prev) => ({ ...prev, venueName: "" }));
                }}
                placeholder="Enter venue name"
              />
              {errors.venueName && (
                <div className="invalid-feedback">{errors.venueName}</div>
              )}
            </div>

            <div className="form-group mb-2">
              <label className="form-label">
                Detailed Address:<span className="text-danger ms-1">*</span>
              </label>
              <textarea
                className={`form-control ${errors.fullAddress ? "is-invalid" : ""}`}
                rows="3"
                value={fullAddress}
                onChange={(e) => {
                  setFullAddress(e.target.value);
                  setErrors((prev) => ({ ...prev, fullAddress: "" }));
                }}
                placeholder="Enter complete event address"
              ></textarea>
              {errors.fullAddress && (
                <div className="invalid-feedback">{errors.fullAddress}</div>
              )}
            </div>

            <div className="form-group mb-2">
              <label className="form-label">
                Locality:<span className="text-danger ms-1">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.locality ? "is-invalid" : ""}`}
                value={locality}
                onChange={(e) => {
                  setLocality(e.target.value);
                  setErrors((prev) => ({ ...prev, locality: "" }));
                }}
                placeholder="Enter locality"
              />
              {errors.locality && (
                <div className="invalid-feedback">{errors.locality}</div>
              )}
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
              <label className="form-label">
                Pincode:<span className="text-danger ms-1">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${errors.pincode ? "is-invalid" : ""}`}
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value);
                  setErrors((prev) => ({ ...prev, pincode: "" }));
                }}
                placeholder="Enter pincode"
              />
              {errors.pincode && (
                <div className="invalid-feedback">{errors.pincode}</div>
              )}
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
              <label className="form-label">
                Upload Document (PDF only, max 300 KB):<span className="text-danger ms-1">*</span>
              </label>
              <input
                type="file"
                className={`form-control ${errors.file ? "is-invalid" : ""}`}
                accept="application/pdf"
                onChange={handleFileChange}
              />
              {errors.file && (
                <div className="invalid-feedback">{errors.file}</div>
              )}
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-success">
                Submit Application
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/my-applications")}
              >
                Cancel
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default PermitApplicationComponent;
