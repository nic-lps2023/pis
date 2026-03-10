import React, { useEffect, useState } from "react";
import {
  createUser,
  getUser,
  updateUser,
  checkEmailExists,
  checkPhoneExists,
} from "../services/UserService";
import {
  getAllDistricts,
  getSubdivisionsByDistrictId,
  getPoliceStationsBySubdivisionId,
} from "../services/LocationService";

import { useNavigate, useParams } from "react-router-dom";

const UserComponent = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpassword, setConfirmpassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");

  const [isActive, setIsActive] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [isVisible, setIsVisible] = useState(true);

  const [roleId, setRoleId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [subdivisionId, setSubdivisionId] = useState("");
  const [policeStationId, setPoliceStationId] = useState("");
  const [districts, setDistricts] = useState([]);
  const [subdivisions, setSubdivisions] = useState([]);
  const [policeStations, setPoliceStations] = useState([]);

  const { id } = useParams();
  const navigator = useNavigate();

  const [errors, setErrors] = useState({
    fullName: "",
    password: "",
    confirmpassword: "",
    email: "",
    phoneNumber: "",
    gender: "",
    address: "",
    policeStationId: "",
  });

  const isOfficerInCharge = String(roleId) === "5";

  useEffect(() => {
    getAllDistricts()
      .then((response) => {
        setDistricts(response.data || []);
      })
      .catch((error) => {
        console.error("Error loading districts:", error);
      });
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
      .then((response) => {
        setSubdivisions(response.data || []);
      })
      .catch((error) => {
        console.error("Error loading subdivisions:", error);
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
      .then((response) => {
        setPoliceStations(response.data || []);
      })
      .catch((error) => {
        console.error("Error loading police stations:", error);
        setPoliceStations([]);
      });
  }, [subdivisionId]);

  useEffect(() => {
    if (id) {
      getUser(id)
        .then(async (response) => {
          const user = response.data;
          setFullName(user.fullName || "");
          setEmail(user.email || "");
          setPhoneNumber(user.phoneNumber || "");
          setGender(user.gender || "");
          setAddress(user.address || "");
          setRoleId(String(user.roleId || ""));
          setPoliceStationId(user.policeStationId ? String(user.policeStationId) : "");

          if (user.policeStationId) {
            try {
              const allDistrictsResponse = await getAllDistricts();
              const allDistricts = allDistrictsResponse.data || [];
              setDistricts(allDistricts);

              for (const district of allDistricts) {
                const subdivisionRes = await getSubdivisionsByDistrictId(district.districtId);
                const subdivisionList = subdivisionRes.data || [];

                for (const subdivision of subdivisionList) {
                  const stationRes = await getPoliceStationsBySubdivisionId(subdivision.subdivisionId);
                  const stationList = stationRes.data || [];

                  if (stationList.some((station) => station.policeStationId === user.policeStationId)) {
                    setDistrictId(String(district.districtId));
                    setSubdivisions(subdivisionList);
                    setSubdivisionId(String(subdivision.subdivisionId));
                    setPoliceStations(stationList);
                    return;
                  }
                }
              }
            } catch (locationError) {
              console.error("Error resolving location hierarchy for OC mapping:", locationError);
            }
          }

          setIsVisible(false);
        })
        .catch((error) => {
          console.error("Error fetching user:", error);
        });
    }
  }, [id]);

  async function saveOrUpdateUser(e) {
    e.preventDefault();

    const isEmailValid = await validateEmailExists();
    const isPhoneValid = await validatePhoneExists();

    if (!isEmailValid || !isPhoneValid) return;

    if (validateForm()) {
      const user = {
        fullName,
        email,
        password,
        phoneNumber,
        gender,
        address,
        isActive,
        isVerified,
        policeStationId:
          isOfficerInCharge && policeStationId
            ? parseInt(policeStationId)
            : null,
      };

      if (id) {
        updateUser(id, user)
          .then(() => navigator("/users"))
          .catch((error) => console.error(error));
      } else {
        createUser(user)
          .then(() => navigator("/login"))
          .catch((error) => console.error(error));
      }
    }
  }

  function validateForm() {
    let valid = true;
    const errorsCopy = { ...errors };

    if (!fullName.trim()) {
      errorsCopy.fullName = "Full Name is required";
      valid = false;
    } else errorsCopy.fullName = "";

    if (isVisible) {
      if (!password.trim()) {
        errorsCopy.password = "Password is required";
        valid = false;
      } else errorsCopy.password = "";

      if (!confirmpassword.trim()) {
        errorsCopy.confirmpassword = "Confirm password is required";
        valid = false;
      } else errorsCopy.confirmpassword = "";

      if (password.trim() !== confirmpassword.trim()) {
        errorsCopy.confirmpassword = "Passwords do not match";
        valid = false;
      }
    }

    if (!email.trim()) {
      errorsCopy.email = "Email is required";
      valid = false;
    } else errorsCopy.email = "";

    if (!phoneNumber.trim()) {
      errorsCopy.phoneNumber = "Phone no. is required";
      valid = false;
    } else errorsCopy.phoneNumber = "";

    if (!gender.trim()) {
      errorsCopy.gender = "Gender is required";
      valid = false;
    } else errorsCopy.gender = "";

    if (!address.trim()) {
      errorsCopy.address = "Address is required";
      valid = false;
    } else errorsCopy.address = "";

    if (isOfficerInCharge && !policeStationId) {
      errorsCopy.policeStationId = "Police station mapping is required for OC";
      valid = false;
    } else {
      errorsCopy.policeStationId = "";
    }

    setErrors(errorsCopy);
    return valid;
  }

  const validateEmailExists = async () => {
    if (!email.trim()) return true;

    try {
      const response = await checkEmailExists(email, id ? id : 0);

      if (response.data === true) {
        setEmailError("Email is already registered!");
        return false;
      } else {
        setEmailError("");
        return true;
      }
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    }
  };

  const validatePhoneExists = async () => {
    if (!phoneNumber.trim()) return true;

    try {
      const response = await checkPhoneExists(phoneNumber, id ? id : 0);

      if (response.data === true) {
        setPhoneError("Phone number is already registered!");
        return false;
      } else {
        setPhoneError("");
        return true;
      }
    } catch (error) {
      console.error("Error checking phone:", error);
      return false;
    }
  };

  function pageTitle() {
    return id ? (
      <h2 className="text-center">Update Profile</h2>
    ) : (
      <h2 className="text-center">User Registration Form</h2>
    );
  }

  return (
    <div className="container">
      <div className="row">
        <div className="card col-md-6 offset-md-3">
          {pageTitle()}

          <div className="card-body">
            <form>
              <div className="form-group mb-2">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter Full Name"
                  value={fullName}
                  className={`form-control ${errors.fullName ? "is-invalid" : ""}`}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setErrors((prev) => ({ ...prev, fullName: "" }));
                  }}
                />
                {errors.fullName && (
                  <div className="invalid-feedback">{errors.fullName}</div>
                )}
              </div>

              {isVisible && (
                <div className="form-group mb-2">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    className={`form-control ${errors.password ? "is-invalid" : ""}`}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                  />
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password}</div>
                  )}
                </div>
              )}

              {isVisible && (
                <div className="form-group mb-2">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmpassword}
                    className={`form-control ${errors.confirmpassword ? "is-invalid" : ""}`}
                    onChange={(e) => {
                      setConfirmpassword(e.target.value);
                      setErrors((prev) => ({ ...prev, confirmpassword: "" }));
                    }}
                  />
                  {errors.confirmpassword && (
                    <div className="invalid-feedback">{errors.confirmpassword}</div>
                  )}
                </div>
              )}

              <div className="form-group mb-2">
                <label className="form-label">Email</label>
                <input
                  type="text"
                  placeholder="Enter email"
                  value={email}
                  className={`form-control ${emailError || errors.email ? "is-invalid" : ""}`}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: "" }));
                    if (emailError) setEmailError("");
                  }}
                  onBlur={validateEmailExists}
                />
                {(errors.email || emailError) && (
                  <div className="invalid-feedback">{errors.email || emailError}</div>
                )}
              </div>

              <div className="form-group mb-2">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  placeholder="Enter Phone Number"
                  value={phoneNumber}
                  className={`form-control ${phoneError || errors.phoneNumber ? "is-invalid" : ""}`}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                    if (phoneError) setPhoneError("");
                  }}
                  onBlur={validatePhoneExists}
                />
                {(errors.phoneNumber || phoneError) && (
                  <div className="invalid-feedback">{errors.phoneNumber || phoneError}</div>
                )}
              </div>

              <div className="form-group mb-2">
                <label className="form-check-label">Select Gender</label>

                <div>
                  <label style={{ marginLeft: "10px" }}>
                    <input
                      type="radio"
                      value="MALE"
                      checked={gender === "MALE"}
                      onChange={(e) => setGender(e.target.value)}
                      style={{ marginRight: "10px" }}
                    />
                    MALE
                  </label>

                  <label style={{ marginLeft: "10px" }}>
                    <input
                      type="radio"
                      value="FEMALE"
                      checked={gender === "FEMALE"}
                      onChange={(e) => setGender(e.target.value)}
                      style={{ marginRight: "10px" }}
                    />
                    FEMALE
                  </label>

                  <label style={{ marginLeft: "10px" }}>
                    <input
                      type="radio"
                      value="TRANSGENDER"
                      checked={gender === "TRANSGENDER"}
                      onChange={(e) => setGender(e.target.value)}
                      style={{ marginRight: "10px" }}
                    />
                    TRANSGENDER
                  </label>
                </div>

                {errors.gender && (
                  <div className="text-danger">{errors.gender}</div>
                )}
              </div>

              <div className="form-group mb-2">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  placeholder="Enter Address"
                  value={address}
                  className={`form-control ${errors.address ? "is-invalid" : ""}`}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setErrors((prev) => ({ ...prev, address: "" }));
                  }}
                />
                {errors.address && (
                  <div className="invalid-feedback">{errors.address}</div>
                )}
              </div>

              {isOfficerInCharge && (
                <>
                  <div className="form-group mb-2">
                    <label className="form-label">District (OC Mapping)</label>
                    <select
                      className="form-control"
                      value={districtId}
                      onChange={(e) => {
                        setDistrictId(e.target.value);
                        setSubdivisionId("");
                        setPoliceStationId("");
                        setErrors((prev) => ({ ...prev, policeStationId: "" }));
                      }}
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
                    <label className="form-label">Sub Division (OC Mapping)</label>
                    <select
                      className="form-control"
                      value={subdivisionId}
                      onChange={(e) => {
                        setSubdivisionId(e.target.value);
                        setPoliceStationId("");
                        setErrors((prev) => ({ ...prev, policeStationId: "" }));
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
                  </div>

                  <div className="form-group mb-2">
                    <label className="form-label">Police Station (OC Mapping)</label>
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
                </>
              )}

              <button className="btn btn-success" onClick={saveOrUpdateUser}>
                Submit
              </button>

              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={() => navigator("/login")}
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserComponent;
