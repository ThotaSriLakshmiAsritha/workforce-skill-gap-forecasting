import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OrgLayout } from './components/layout/OrgLayout';
import { EmployeeLayout } from './components/layout/EmployeeLayout';
import { ErrorFallback } from './components/ErrorFallback';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import OAuthCallback from './pages/auth/OAuthCallback';
import Dashboard from './pages/org/Dashboard';
import ProjectAllocator from './pages/org/ProjectAllocator';
import ResumeScreener from './pages/org/ResumeScreener';
import MyProfile from './pages/employee/MyProfile';
import MyLearningPath from './pages/employee/MyLearningPath';
import MyProjects from './pages/employee/MyProjects';
import SkillGapToGoal from './pages/employee/SkillGapToGoal';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
    errorElement: <ErrorFallback />
  },
  {
    path: '/login',
    element: <Login />,
    errorElement: <ErrorFallback />
  },
  {
    path: '/auth/callback',
    element: <OAuthCallback />,
    errorElement: <ErrorFallback />
  },
  {
    path: '/org',
    element: <ProtectedRoute allowedRoles={['hr_manager', 'org_admin', 'team_lead']} />,
    errorElement: <ErrorFallback />,
    children: [
      {
        element: <OrgLayout />,
        children: [
          { index: true, element: <Navigate to="/org/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'allocator', element: <ProjectAllocator /> },
          { path: 'screener', element: <ResumeScreener /> }
        ],
      },
    ],
  },
  {
    path: '/employee',
    element: <ProtectedRoute allowedRoles={['employee']} />,
    errorElement: <ErrorFallback />,
    children: [
      {
        element: <EmployeeLayout />,
        children: [
          { index: true, element: <Navigate to="/employee/profile" replace /> },
          { path: 'profile', element: <MyProfile /> },
          { path: 'learning', element: <MyLearningPath /> },
          { path: 'projects', element: <MyProjects /> },
          { path: 'gap-goal', element: <Navigate to="/employee/skill-goal" replace /> },
          { path: 'skill-goal', element: <SkillGapToGoal /> }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
    errorElement: <ErrorFallback />
  }
]);
