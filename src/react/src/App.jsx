import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLayout from './pages/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ManageCompaniesPage from './pages/ManageCompaniesPage';
import ManageCandidatesPage from './pages/ManageCandidatesPage';
import ManageJobsAdminPage from './pages/ManageJobsAdminPage';
import SystemLogsPage from './pages/SystemLogsPage';
import CompanyLayout from './pages/CompanyLayout';
import CompanyDashboardPage from './pages/CompanyDashboardPage';
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
import ManageResumePage from './pages/ManageResumePage';
import MyInterviewsPage from './pages/MyInterviewsPage';
import './styles/force-theme.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/company" element={<CompanyLayout />}>
        <Route path="dashboard" element={<CompanyDashboardPage />} />
        <Route path="post-job" element={<PostJobPage />} />
        <Route path="manage-jobs" element={<ManageJobsCompanyPage />} />
        <Route path="applications" element={<ViewApplicationsPage />} />
        <Route path="applications/:jobId" element={<ViewApplicationsPage />} />
        <Route path="application-details/:id" element={<ApplicationDetailsPage />} />
        <Route path="schedule-interview/:applicationId" element={<ScheduleInterviewPage />} />
        <Route path="profile" element={<CompanyProfilePage />} />
      </Route>

      <Route path="/candidate" element={<CandidateLayout />}>
        <Route path="dashboard" element={<CandidateDashboardPage />} />
        <Route path="browse-jobs" element={<BrowseJobsPage />} />
        <Route path="job-details/:id" element={<JobDetailsPage />} />
        <Route path="my-applications" element={<MyApplicationsPage />} />
        <Route path="profile" element={<CandidateProfilePage />} />
        <Route path="manage-resume" element={<ManageResumePage />} />
        <Route path="my-interviews" element={<MyInterviewsPage />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="companies" element={<ManageCompaniesPage />} />
        <Route path="jobs" element={<ManageJobsAdminPage />} />
        <Route path="candidates" element={<ManageCandidatesPage />} />
        <Route path="logs" element={<SystemLogsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
