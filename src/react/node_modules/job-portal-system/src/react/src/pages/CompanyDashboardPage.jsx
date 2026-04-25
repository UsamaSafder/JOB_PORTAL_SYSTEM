import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompanyApplications, getCompanyJobs } from '../services/companyService';
import '../../../app/company/company-dashboard/company-dashboard.css';

function CompanyDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const [jobsResult, appsResult] = await Promise.allSettled([
          getCompanyJobs(),
          getCompanyApplications()
        ]);

        if (jobsResult.status === 'fulfilled') {
          setJobs(Array.isArray(jobsResult.value) ? jobsResult.value : []);
        } else {
          setJobs([]);
        }

        if (appsResult.status === 'fulfilled') {
          setApplications(Array.isArray(appsResult.value) ? appsResult.value : []);
        } else {
          setApplications([]);
        }

        if (jobsResult.status === 'rejected' && appsResult.status === 'rejected') {
          const jobsError = jobsResult.reason?.response?.data?.error || jobsResult.reason?.message;
          const appsError = appsResult.reason?.response?.data?.error || appsResult.reason?.message;
          setErrorMessage(jobsError || appsError || 'Failed to load dashboard data.');
        }
      } catch (error) {
        setErrorMessage(error?.response?.data?.error || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getJobStatusMeta = (job) => {
    if (!job?.isActive) {
      return { label: 'Inactive', className: 'inactive' };
    }

    if (!job?.deadline) {
      return { label: 'Active', className: 'active' };
    }

    const deadline = new Date(job.deadline);
    deadline.setHours(23, 59, 59, 999);

    if (deadline < new Date()) {
      return { label: 'Expired', className: 'expired' };
    }

    return { label: 'Active', className: 'active' };
  };

  const stats = useMemo(() => {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((job) => getJobStatusMeta(job).label === 'Active').length;
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(
      (app) => String(app.status || '').toLowerCase() === 'pending'
    ).length;
    const reviewedApplications = applications.filter(
      (app) => String(app.status || '').toLowerCase() === 'reviewed'
    ).length;
    const acceptedApplications = applications.filter(
      (app) => String(app.status || '').toLowerCase() === 'accepted'
    ).length;

    return {
      totalJobs,
      activeJobs,
      totalApplications,
      pendingApplications,
      reviewedApplications,
      acceptedApplications
    };
  }, [applications, jobs]);

  const recentJobs = useMemo(() => jobs.slice(0, 5), [jobs]);
  const recentApplications = useMemo(() => applications.slice(0, 5), [applications]);

  const getStatusClass = (status) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'pending') return 'status-pending';
    if (normalized === 'reviewed') return 'status-reviewed';
    if (normalized === 'accepted') return 'status-accepted';
    if (normalized === 'rejected') return 'status-rejected';
    return '';
  };

  return (
    <div className="dashboard-container">
      <h1 className="page-title">Company Dashboard</h1>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      ) : (
        <>
          {errorMessage ? <div className="empty-state"><p>{errorMessage}</p></div> : null}

          <div className="stats-grid">
            <div className="stat-card stat-primary">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>{stats.totalJobs}</h3>
                <p>Total Jobs Posted</p>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats.activeJobs}</h3>
                <p>Active Jobs</p>
              </div>
            </div>

            <div className="stat-card stat-warning">
              <div className="stat-icon">📄</div>
              <div className="stat-info">
                <h3>{stats.totalApplications}</h3>
                <p>Total Applications</p>
              </div>
            </div>

            <div className="stat-card stat-info">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{stats.pendingApplications}</h3>
                <p>Pending Review</p>
              </div>
            </div>

            <div className="stat-card stat-reviewed">
              <div className="stat-icon">👁️</div>
              <div className="stat-info">
                <h3>{stats.reviewedApplications}</h3>
                <p>Reviewed</p>
              </div>
            </div>

            <div className="stat-card stat-accepted">
              <div className="stat-icon">🎉</div>
              <div className="stat-info">
                <h3>{stats.acceptedApplications}</h3>
                <p>Accepted</p>
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className="section-header">
              <h2>Recent Job Postings</h2>
              <button className="btn-primary" onClick={() => navigate('/company/post-job')}>
                + Post New Job
              </button>
            </div>

            {recentJobs.length === 0 ? (
              <div className="empty-state">
                <p>No jobs posted yet. Start by posting your first job!</p>
                <button className="btn-primary" onClick={() => navigate('/company/post-job')}>Post Job</button>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Job Title</th>
                        <th>Location</th>
                        <th>Employment Type</th>
                        <th>Posted Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentJobs.map((job) => (
                        (() => {
                          const statusMeta = getJobStatusMeta(job);
                          return (
                        <tr key={job.jobId}>
                          <td>{job.title}</td>
                          <td>{job.location || 'N/A'}</td>
                          <td><span className="badge">{job.employmentType}</span></td>
                          <td>{job.postedAt ? new Date(job.postedAt).toLocaleDateString() : '-'}</td>
                          <td>
                            <span className={`status-badge ${statusMeta.className}`}>
                              {statusMeta.label}
                            </span>
                          </td>
                          <td>
                            <button className="btn-action" onClick={() => navigate('/company/manage-jobs')}>
                              View
                            </button>
                          </td>
                        </tr>
                          );
                        })()
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="section-footer">
                  <a href="#" className="link" onClick={(e) => { e.preventDefault(); navigate('/company/manage-jobs'); }}>
                    View All Jobs →
                  </a>
                </div>
              </>
            )}
          </div>

          <div className="section-card">
            <div className="section-header">
              <h2>Recent Applications</h2>
              <a href="#" className="link" onClick={(e) => { e.preventDefault(); navigate('/company/applications'); }}>
                View All →
              </a>
            </div>

            {recentApplications.length === 0 ? (
              <div className="empty-state">
                <p>No applications received yet.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Candidate Name</th>
                      <th>Job Title</th>
                      <th>Applied Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentApplications.map((application) => (
                      <tr key={application.applicationId}>
                        <td>{application.candidateName || 'N/A'}</td>
                        <td>{application.jobTitle || 'N/A'}</td>
                        <td>{application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : '-'}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(application.status)}`}>
                            {application.status || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-action"
                            onClick={() => navigate(`/company/application-details/${application.applicationId}`)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="company-quick-actions">
            <h2>Quick Actions</h2>
            <div className="company-action-buttons">
              <button className="company-action-btn" onClick={() => navigate('/company/post-job')}>
                <span className="company-action-icon">➕</span>
                <span className="company-action-label">Post New Job</span>
              </button>
              <button className="company-action-btn" onClick={() => navigate('/company/applications')}>
                <span className="company-action-icon">📄</span>
                <span className="company-action-label">View Applications</span>
              </button>
              <button className="company-action-btn" onClick={() => navigate('/company/manage-jobs')}>
                <span className="company-action-icon">📋</span>
                <span className="company-action-label">Manage Jobs</span>
              </button>
              <button className="company-action-btn" onClick={() => navigate('/company/profile')}>
                <span className="company-action-icon">🏢</span>
                <span className="company-action-label">Edit Profile</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CompanyDashboardPage;
