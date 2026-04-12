import { createBrowserRouter, Navigate } from "react-router-dom";
import { OrgLayout } from "./components/layout/OrgLayout";
import { EmployeeLayout } from "./components/layout/EmployeeLayout";
import { ErrorFallback } from "./components/ErrorFallback";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/org/Dashboard";
import ProjectAllocator from "./pages/org/ProjectAllocator";
import ResumeScreener from "./pages/org/ResumeScreener";
import MyProfile from "./pages/employee/MyProfile";
import EmployeeResumeScreener from "./pages/employee/EmployeeResumeScreener";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
    errorElement: <ErrorFallback />,
  },
  {
    path: "/login",
    element: <Login />,
    errorElement: <ErrorFallback />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallback />,
    errorElement: <ErrorFallback />,
  },
  {
    path: "/dashboard",
    element: <Navigate to="/org/dashboard" replace />,
    errorElement: <ErrorFallback />,
  },
  {
    path: "/org",
    errorElement: <ErrorFallback />,
    children: [
      {
        element: (
          <ProtectedRoute
            allowedRoles={["org_admin", "hr_manager", "team_lead"]}
          />
        ),
        children: [
          {
            element: <OrgLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="/org/dashboard" replace />,
              },
              { path: "dashboard", element: <Dashboard /> },
              { path: "allocator", element: <ProjectAllocator /> },
              { path: "screener", element: <ResumeScreener /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "/employee",
    errorElement: <ErrorFallback />,
    children: [
      {
        element: <ProtectedRoute allowedRoles={["employee"]} />,
        children: [
          {
            element: <EmployeeLayout />,
            children: [
              {
                index: true,
                element: <Navigate to="/employee/profile" replace />,
              },
              { path: "profile", element: <MyProfile /> },
              { path: "resume-screener", element: <EmployeeResumeScreener /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
    errorElement: <ErrorFallback />,
  },
]);
