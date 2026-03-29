import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCandidateApplications,
  getCandidateStats,
  getRecommendedJobs
} from '../services/candidateService';
import { toPublicFileUrl } from '../utils/media';
import '../../../app/candidate/candidate-dashboard/candidate-dashboard.css';

function CandidateDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    interviewsScheduled: 0,
    rejectedApplications: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsData, appsData, jobsData] = await Promise.all([
          getCandidateStats(),
          getCandidateApplications(),
          getRecommendedJobs()
        ]);

        setStats({
          totalApplications: statsData.totalApplications || 0,
          pendingApplications: statsData.pendingApplications || 0,
          interviewsScheduled: statsData.interviewsScheduled || 0,
          rejectedApplications: statsData.rejectedApplications || 0
        });

        setRecentApplications((appsData || []).slice(0, 5));
        setRecommendedJobs((jobsData || []).slice(0, 5));
      } catch {
        setStats({
          totalApplications: 0,
          pendingApplications: 0,
          interviewsScheduled: 0,
          rejectedApplications: 0
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const getStatusClass = (status) => {
    const text = String(status || '').toLowerCase();
    if (text === 'pending') return 'status-pending';
    if (text === 'reviewed') return 'status-review';
    if (text === 'interview') return 'status-interview';
    if (text === 'accepted') return 'status-accepted';
    if (text === 'rejected') return 'status-rejected';
    return 'status-pending';
  };

  const getStatusIcon = (status) => {
    const text = String(status || '').toLowerCase();
    if (text === 'pending') return '⏳';
    if (text === 'reviewed') return '👁️';
    if (text === 'interview') return '📅';
    if (text === 'accepted') return '✅';
    if (text === 'rejected') return '❌';
    return '📄';
  };

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <h2>Welcome Back! 👋</h2>
        <p>Here's what's happening with your job search today.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card card-blue">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalApplications}</h3>
            <p>Total Applications</p>
          </div>
        </div>

        <div className="stat-card card-yellow">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingApplications}</h3>
            <p>Pending Review</p>
          </div>
        </div>

        <div className="stat-card card-green">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{stats.interviewsScheduled}</h3>
            <p>Interviews Scheduled</p>
          </div>
        </div>

        <div className="stat-card card-red">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{stats.rejectedApplications}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="section-card">
          <div className="section-header">
            <h3>Recent Applications</h3>
            <Link to="/candidate/my-applications" className="view-all-link">View All →</Link>
          </div>

          {loading ? <div className="loading-spinner">Loading...</div> : null}

          {!loading && recentApplications.length === 0 ? (
            <div className="empty-state">
              <p>No applications yet</p>
              <Link to="/candidate/browse-jobs" className="btn-primary">Browse Jobs</Link>
            </div>
          ) : null}

          {!loading && recentApplications.length > 0 ? (
            <div className="applications-list">
              {recentApplications.map((application) => (
                <div key={application.applicationId} className="application-item">
                  <div className="application-info">
                    <h4>{application.jobTitle || '-'}</h4>
                    <p className="company-name">{application.companyName || '-'}</p>
                    <p className="applied-date">
                      Applied: {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div className="application-status">
                    <span className={`status-badge ${getStatusClass(application.status)}`}>
                      {getStatusIcon(application.status)} {application.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="section-card">
          <div className="section-header">
            <h3>Recommended Jobs</h3>
            <Link to="/candidate/browse-jobs" className="view-all-link">View All →</Link>
          </div>

          {loading ? <div className="loading-spinner">Loading...</div> : null}

          {!loading && recommendedJobs.length === 0 ? (
            <div className="empty-state">
              <p>No recommendations available</p>
            </div>
          ) : null}

          {!loading && recommendedJobs.length > 0 ? (
            <div className="jobs-list">
              {recommendedJobs.map((job) => (
                <div key={job.jobId} className="job-item">
                  {toPublicFileUrl(job.logo) ? (
                    <img src={toPublicFileUrl(job.logo)} alt={job.companyName || 'Company'} className="job-company-logo" />
                  ) : (
                    <div className="job-company-logo">{(job.companyName || 'C').charAt(0)}</div>
                  )}
                  <div className="job-info">
                    <h4>{job.title}</h4>
                    <p className="company-name">{job.companyName}</p>
                    <div className="job-details">
                      <span className="job-detail">📍 {job.location}</span>
                      <span className="job-detail">💼 {job.employmentType}</span>
                    </div>
                  </div>
                  <div className="job-action">
                    <Link to={`/candidate/job-details/${job.jobId}`} className="btn-view">View</Link>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <Link to="/candidate/browse-jobs" className="action-card">
            <span className="action-icon">🔍</span>
            <span className="action-label">Browse Jobs</span>
          </Link>
          <Link to="/candidate/profile" className="action-card">
            <span className="action-icon">👤</span>
            <span className="action-label">Update Profile</span>
          </Link>
          <Link to="/candidate/manage-resume" className="action-card">
            <span className="action-icon">📋</span>
            <span className="action-label">Upload Resume</span>
          </Link>
          <Link to="/candidate/my-interviews" className="action-card">
            <span className="action-icon">📅</span>
            <span className="action-label">View Interviews</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CandidateDashboardPage;
