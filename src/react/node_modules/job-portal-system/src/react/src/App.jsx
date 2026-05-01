import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLayout from './pages/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminSupportPage from './pages/AdminSupportPage';
import ManageCompaniesPage from './pages/ManageCompaniesPage';
import ManageCandidatesPage from './pages/ManageCandidatesPage';
import ManageJobsAdminPage from './pages/ManageJobsAdminPage';
import SystemLogsPage from './pages/SystemLogsPage';
import CompanyLayout from './pages/CompanyLayout';
import CompanyDashboardPage from './pages/CompanyDashboardPage';
import CompanyMessagesPage from './pages/CompanyMessagesPage';
import CompanySupportPage from './pages/CompanySupportPage';
import PostJobPage from './pages/PostJobPage';
import ManageJobsCompanyPage from './pages/ManageJobsCompanyPage';
import ViewApplicationsPage from './pages/ViewApplicationsPage';
import ApplicationDetailsPage from './pages/ApplicationDetailsPage';
import ScheduleInterviewPage from './pages/ScheduleInterviewPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import CandidateLayout from './pages/CandidateLayout';
import CandidateDashboardPage from './pages/CandidateDashboardPage';
import BrowseJobsPage from './pages/BrowseJobsPage';
import JobDetailsPage from './pages/JobDetailsPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import CandidateProfilePage from './pages/CandidateProfilePage';
import CandidateMessagesPage from './pages/CandidateMessagesPage';
import ManageResumePage from './pages/ManageResumePage';
import MyInterviewsPage from './pages/MyInterviewsPage';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/force-theme.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Company Routes - Protected */}
      <Route path="/company" element={<ProtectedRoute element={<CompanyLayout />} allowedRoles={['company']} />}>
        <Route path="dashboard" element={<ProtectedRoute element={<CompanyDashboardPage />} allowedRoles={['company']} />} />
        <Route path="messages" element={<ProtectedRoute element={<CompanyMessagesPage />} allowedRoles={['company']} />} />
        <Route path="post-job" element={<ProtectedRoute element={<PostJobPage />} allowedRoles={['company']} />} />
        <Route path="manage-jobs" element={<ProtectedRoute element={<ManageJobsCompanyPage />} allowedRoles={['company']} />} />
        <Route path="applications" element={<ProtectedRoute element={<ViewApplicationsPage />} allowedRoles={['company']} />} />
        <Route path="support" element={<ProtectedRoute element={<CompanySupportPage />} allowedRoles={['company']} />} />
        <Route path="applications/:jobId" element={<ProtectedRoute element={<ViewApplicationsPage />} allowedRoles={['company']} />} />
        <Route path="application-details/:id" element={<ProtectedRoute element={<ApplicationDetailsPage />} allowedRoles={['company']} />} />
        <Route path="schedule-interview/:applicationId" element={<ProtectedRoute element={<ScheduleInterviewPage />} allowedRoles={['company']} />} />
        <Route path="profile" element={<ProtectedRoute element={<CompanyProfilePage />} allowedRoles={['company']} />} />
      </Route>

      {/* Candidate Routes - Protected */}
      <Route path="/candidate" element={<ProtectedRoute element={<CandidateLayout />} allowedRoles={['candidate']} />}>
        <Route path="dashboard" element={<ProtectedRoute element={<CandidateDashboardPage />} allowedRoles={['candidate']} />} />
        <Route path="browse-jobs" element={<ProtectedRoute element={<BrowseJobsPage />} allowedRoles={['candidate']} />} />
        <Route path="job-details/:id" element={<ProtectedRoute element={<JobDetailsPage />} allowedRoles={['candidate']} />} />
        <Route path="my-applications" element={<ProtectedRoute element={<MyApplicationsPage />} allowedRoles={['candidate']} />} />
        <Route path="profile" element={<ProtectedRoute element={<CandidateProfilePage />} allowedRoles={['candidate']} />} />
        <Route path="messages" element={<ProtectedRoute element={<CandidateMessagesPage />} allowedRoles={['candidate']} />} />
        <Route path="manage-resume" element={<ProtectedRoute element={<ManageResumePage />} allowedRoles={['candidate']} />} />
        <Route path="my-interviews" element={<ProtectedRoute element={<MyInterviewsPage />} allowedRoles={['candidate']} />} />
      </Route>

      {/* Admin Routes - Protected */}
      <Route path="/admin" element={<ProtectedRoute element={<AdminLayout />} allowedRoles={['admin']} />}>
        <Route path="dashboard" element={<ProtectedRoute element={<AdminDashboardPage />} allowedRoles={['admin']} />} />
        <Route path="support" element={<ProtectedRoute element={<AdminSupportPage />} allowedRoles={['admin']} />} />
        <Route path="companies" element={<ProtectedRoute element={<ManageCompaniesPage />} allowedRoles={['admin']} />} />
        <Route path="jobs" element={<ProtectedRoute element={<ManageJobsAdminPage />} allowedRoles={['admin']} />} />
        <Route path="candidates" element={<ProtectedRoute element={<ManageCandidatesPage />} allowedRoles={['admin']} />} />
        <Route path="logs" element={<ProtectedRoute element={<SystemLogsPage />} allowedRoles={['admin']} />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
