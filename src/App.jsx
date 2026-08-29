import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";

import CitizenLogin from "./pages/auth/CitizenLogin";
import CitizenSignup from "./pages/auth/CitizenSignup";
import DepartmentLogin from "./pages/auth/DepartmentLogin";
import DepartmentRequestAccess from "./pages/auth/DepartmentRequestAccess";
import WorkerLogin from "./pages/auth/WorkerLogin";
import WorkerSignup from "./pages/auth/WorkerSignup";
import MunicipalLogin from "./pages/auth/MunicipalLogin";

import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import DepartmentDashboard from "./pages/department/DepartmentDashboard";
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import MunicipalDashboard from "./pages/municipal/MunicipalDashboard";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/citizen/login" element={<CitizenLogin />} />
          <Route path="/citizen/signup" element={<CitizenSignup />} />
          <Route
            path="/citizen/dashboard"
            element={
              <ProtectedRoute allowedRole="public">
                <CitizenDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/department/login" element={<DepartmentLogin />} />
          <Route path="/department/request-access" element={<DepartmentRequestAccess />} />
          <Route
            path="/department/dashboard"
            element={
              <ProtectedRoute allowedRole="department">
                <DepartmentDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/worker/login" element={<WorkerLogin />} />
          <Route path="/worker/signup" element={<WorkerSignup />} />
          <Route
            path="/worker/dashboard"
            element={
              <ProtectedRoute allowedRole="worker">
                <WorkerDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/municipal/login" element={<MunicipalLogin />} />
          <Route
            path="/municipal/dashboard"
            element={
              <ProtectedRoute allowedRole="municipal">
                <MunicipalDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
