import React, { useEffect, useState } from "react";
import {
  createUser,
  getUser,
  updateUser,
  checkEmailExists,
  checkPhoneExists,
} from "../services/UserService";

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
  });

  useEffect(() => {
    if (id) {
      getUser(id)
        .then((response) => {
          setFullName(response.data.fullName);
          setEmail(response.data.email);
          setPhoneNumber(response.data.phoneNumber);
          setGender(response.data.gender);
          setAddress(response.data.address);

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
      errorsCopy.phoneNumber = "Phone number is required";
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
                  onChange={(e) => setFullName(e.target.value)}
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
                    onChange={(e) => setPassword(e.target.value)}
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
                    onChange={(e) => setConfirmpassword(e.target.value)}
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
                  className={`form-control ${emailError ? "is-invalid" : ""}`}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={validateEmailExists}
                />
                {emailError && <p style={{ color: "red" }}>{emailError}</p>}
              </div>

              <div className="form-group mb-2">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  placeholder="Enter Phone Number"
                  value={phoneNumber}
                  className={`form-control ${phoneError ? "is-invalid" : ""}`}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  onBlur={validatePhoneExists}
                />
                {phoneError && <p style={{ color: "red" }}>{phoneError}</p>}
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
                  onChange={(e) => setAddress(e.target.value)}
                />
                {errors.address && (
                  <div className="invalid-feedback">{errors.address}</div>
                )}
              </div>

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
