import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { OrgLayout } from './components/layout/OrgLayout';
import { EmployeeLayout } from './components/layout/EmployeeLayout';

import Login from './pages/auth/Login';
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
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/org',
    element: <ProtectedRoute allowedRoles={['hr_manager', 'org_admin']} />,
    children: [
      {
        element: <OrgLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'allocator', element: <ProjectAllocator /> },
          { path: 'screener', element: <ResumeScreener /> }
        ],
      },
    ],
  },
  {
    path: '/employee',
    element: <ProtectedRoute allowedRoles={['employee']} />,
    children: [
      {
        element: <EmployeeLayout />,
        children: [
          { index: true, element: <MyProfile /> },
          { path: 'learning', element: <MyLearningPath /> },
          { path: 'projects', element: <MyProjects /> },
          { path: 'gap-goal', element: <SkillGapToGoal /> }
        ]
      }
    ]
  }
]);
