import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCandidateApplications, withdrawApplication } from '../services/candidateService';
import { DialogModal, Toast, useDialog } from '../components/Dialog';
import { toPublicFileUrl } from '../utils/media';
import '../../../app/candidate/my-applications/my-applications.css';

const STATUS_OPTIONS = ['All', 'Pending', 'Reviewed', 'Interview', 'Accepted', 'Rejected'];

function MyApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const { notify, confirm, toast, modal, dismissToast, handleModalResult } = useDialog();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCandidateApplications();
        setApplications(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredApplications = useMemo(() => {
    if (!selectedStatus) {
      return applications;
    }
    const normalized = selectedStatus.toLowerCase();
    return applications.filter((item) => String(item.status || '').toLowerCase() === normalized);
  }, [applications, selectedStatus]);

  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((item) => String(item.status || '').toLowerCase() === 'pending').length;
    const review = applications.filter((item) => String(item.status || '').toLowerCase() === 'reviewed').length;
    const interview = applications.filter((item) => String(item.status || '').toLowerCase() === 'interview').length;
    const accepted = applications.filter((item) => String(item.status || '').toLowerCase() === 'accepted').length;
    return { total, pending, review, interview, accepted };
  }, [applications]);

  const handleWithdraw = async (applicationId) => {
    if (!applicationId) return;

    const ok = await confirm('Withdraw this application?', 'This action cannot be undone.');
    if (!ok) return;

    try {
      await withdrawApplication(applicationId);
      setApplications((prev) => prev.filter((item) => item.applicationId !== applicationId));
      notify('Application withdrawn successfully.');
    } catch (error) {
      notify(error?.response?.data?.error || 'Failed to withdraw application.', 'error');
    }
  };

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
    <div className="applications-container">
      <Toast toast={toast} onDismiss={dismissToast} />
      <DialogModal modal={modal} onResult={handleModalResult} />
      <div className="page-header">
        <h2>My Applications</h2>
        <p>Track and manage your job applications</p>
      </div>

      <div className="ma-stats-grid">
        <div className="ma-stat-card"><span className="ma-stat-label">Total</span><span className="ma-stat-value">{stats.total}</span></div>
        <div className="ma-stat-card"><span className="ma-stat-label">Pending</span><span className="ma-stat-value">{stats.pending}</span></div>
        <div className="ma-stat-card"><span className="ma-stat-label">Reviewed</span><span className="ma-stat-value">{stats.review}</span></div>
        <div className="ma-stat-card"><span className="ma-stat-label">Interview</span><span className="ma-stat-value">{stats.interview}</span></div>
        <div className="ma-stat-card"><span className="ma-stat-label">Accepted</span><span className="ma-stat-value">{stats.accepted}</span></div>
      </div>

      <div className="filter-section">
        <div className="filter-group">
          <label htmlFor="statusFilter">Filter by Status:</label>
          <select
            id="statusFilter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status === 'All' ? '' : status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="results-count">
          Showing {filteredApplications.length} of {applications.length} applications
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading applications...</p>
        </div>
      ) : null}

      {!loading && filteredApplications.length > 0 ? (
        <div className="ma-applications-list">
          {filteredApplications.map((application) => (
            <div key={application.applicationId} className="ma-application-card">
              <div className="ma-card-header">
                {toPublicFileUrl(application.companyLogo || application.logo) ? (
                  <img
                    src={toPublicFileUrl(application.companyLogo || application.logo)}
                    alt={application.companyName || 'Company'}
                    className="ma-company-logo ma-company-logo-image"
                  />
                ) : (
                  <div className="ma-company-logo">{(application.companyName || 'C').charAt(0)}</div>
                )}
                <div className="ma-job-info">
                  <h3>{application.jobTitle}</h3>
                  <p className="ma-company-name">{application.companyName}</p>
                </div>
                <span className={`ma-status-badge ${getStatusClass(application.status)}`}>
                  {getStatusIcon(application.status)} {application.status}
                </span>
              </div>

              <div className="ma-card-body">
                <div className="ma-info-grid">
                  <div className="ma-info-item">
                    <span className="ma-info-label">📅 Applied Date:</span>
                    <span className="ma-info-value">
                      {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div className="ma-info-item">
                    <span className="ma-info-label">📍 Location:</span>
                    <span className="ma-info-value">{application.jobLocation || 'Remote'}</span>
                  </div>
                  <div className="ma-info-item">
                    <span className="ma-info-label">💼 Job Type:</span>
                    <span className="ma-info-value">{application.employmentType || 'Full-time'}</span>
                  </div>
                  <div className="ma-info-item">
                    <span className="ma-info-label">💰 Salary:</span>
                    <span className="ma-info-value">{application.salaryRange || 'Not specified'}</span>
                  </div>
                </div>

                {application.feedback || application.notes ? (
                  <div className="ma-feedback-section">
                    <h4>Feedback:</h4>
                    <p>{application.feedback || application.notes}</p>
                  </div>
                ) : null}
              </div>

              <div className="ma-card-footer">
                <Link to={`/candidate/job-details/${application.jobId}`} className="ma-btn-view">
                  View Job Details
                </Link>
                {['pending', 'reviewed'].includes(String(application.status || '').toLowerCase()) ? (
                  <button
                    onClick={() => handleWithdraw(application.applicationId)}
                    className="ma-btn-withdraw"
                  >
                    Withdraw
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && filteredApplications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No Applications Found</h3>
          {selectedStatus ? <p>No applications with status "{selectedStatus}"</p> : <p>You haven't applied to any jobs yet</p>}
          <Link to="/candidate/browse-jobs" className="btn-primary">Browse Jobs</Link>
        </div>
      ) : null}
    </div>
  );
}

export default MyApplicationsPage;
