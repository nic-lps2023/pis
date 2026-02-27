import "./App.css";
import HeaderComponent from "./components/HeaderComponent";
import ListUserComponent from "./components/ListUserComponent";
import UserComponent from "./components/UserComponent";
import LoginComponent from "./components/LoginComponent";
import MyApplicationsComponent from "./components/MyApplicationsComponent";
import PermitApplicationComponent from "./components/PermitApplicationComponent";
import PrivateRoute from "./components/PrivateRoute";
import AuthorityDashboard from "./components/authority/AuthorityDashboard";
import SPDashboard from "./components/authority/SPDashboard";
import SDPODashboard from "./components/authority/SDPODashboard";
import OCDashboard from "./components/authority/OCDashboard";
import AuthorityInbox from "./components/authority/AuthorityInbox";
import AuthorityApplicationDetails from "./components/authority/AuthorityApplicationDetails";

import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <BrowserRouter>
        <HeaderComponent />

        <Routes>
          <Route path="/" element={<LoginComponent />} />
          <Route path="/login" element={<LoginComponent />} />

          <Route path="/register-user" element={<UserComponent />} />

          {/* Applicant Routes - Role 7 */}
          <Route
            path="/permit-application"
            element={
              <PrivateRoute allowedRoles={[7]}>
                <PermitApplicationComponent />
              </PrivateRoute>
            }
          />

          <Route
            path="/my-applications"
            element={
              <PrivateRoute allowedRoles={[7]}>
                <MyApplicationsComponent />
              </PrivateRoute>
            }
          />

          {/* Admin Routes - Role 1 */}
          <Route
            path="/users"
            element={
              <PrivateRoute allowedRoles={[1]}>
                <ListUserComponent />
              </PrivateRoute>
            }
          />

          <Route
            path="/edit-register-user/:id"
            element={
              <PrivateRoute allowedRoles={[1]}>
                <UserComponent />
              </PrivateRoute>
            }
          />

          {/* Authority Routes - Roles 2, 3, 4, 5, 6 (DC, SP, SDPO, OC, AUTHORITY) */}
          <Route
            path="/authority-dashboard"
            element={
              <PrivateRoute allowedRoles={[2, 3, 4, 5, 6]}>
                <AuthorityDashboard />
              </PrivateRoute>
            }
          />

          {/* SP Dashboard - Role 3 */}
          <Route
            path="/authority/sp-dashboard"
            element={
              <PrivateRoute allowedRoles={[3]}>
                <SPDashboard />
              </PrivateRoute>
            }
          />

          {/* SDPO Dashboard - Role 4 */}
          <Route
            path="/authority/sdpo-dashboard"
            element={
              <PrivateRoute allowedRoles={[4]}>
                <SDPODashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/authority/inbox"
            element={
              <PrivateRoute allowedRoles={[2, 3, 4, 5, 6]}>
                <AuthorityInbox />
              </PrivateRoute>
            }
          />
          <Route
            path="/authority/application/:id"
            element={
              <PrivateRoute allowedRoles={[2, 3, 4, 5, 6]}>
                <AuthorityApplicationDetails />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
