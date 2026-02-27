import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/AuthService";
import { getRedirectPathByRole } from "../utils/roleRedirect";

const LoginComponent = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const navigator = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!userId.trim() || !password.trim()) {
      setErrorMsg("User ID and Password are required!");
      return;
    }

    try {
      const response = await loginUser(userId, password);

      if (response.data.success === false) {
        setErrorMsg(response.data.message);
        return;
      }

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.userId);
      localStorage.setItem("fullName", response.data.fullName);
      localStorage.setItem("email", response.data.email);
      localStorage.setItem("phoneNumber", response.data.phoneNumber);
      localStorage.setItem("roleId", response.data.roleId);
      localStorage.setItem("roleName", response.data.roleName);

      setErrorMsg("");

      // Redirect based on user role
      const redirectPath = getRedirectPathByRole(response.data.roleId);
      navigator(redirectPath);
    } catch (error) {
      console.error(error);
      setErrorMsg("Invalid Email/Mobile Number or Password!");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-5">
          <div className="card shadow p-4">
            <h3 className="text-center mb-4">Login</h3>

            {errorMsg && (
              <div className="alert alert-danger text-center">{errorMsg}</div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label">Email / Mobile No.</label>
                <input
                  type="text"
                  className="form-control"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter email or mobile number"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>

              <button type="submit" className="btn btn-primary w-100">
                Login
              </button>
            </form>

            <div className="text-center mt-3">
              <p>
                Not registered?{" "}
                <span
                  style={{
                    color: "blue",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                  onClick={() => navigator("/register-user")}
                >
                  Register Here
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
