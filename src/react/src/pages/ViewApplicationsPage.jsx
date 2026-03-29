import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getApplicationsByJobId,
  getCompanyApplications,
  updateApplicationStatus
} from '../services/companyService';
import { Toast, useDialog } from '../components/Dialog';
import '../../../app/company/view-applications/view-applications.css';

function ViewApplicationsPage() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const { notify, toast, dismissToast } = useDialog();

  const loadApplications = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = jobId ? await getApplicationsByJobId(jobId) : await getCompanyApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(error?.response?.data?.error || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [jobId]);

  const filteredApplications = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return applications.filter((app) => {
      const matchesSearch =
        !term ||
        (app.candidateName || '').toLowerCase().includes(term) ||
        (app.candidateEmail || '').toLowerCase().includes(term) ||
        (app.jobTitle || '').toLowerCase().includes(term);

      const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [applications, filterStatus, searchTerm]);

  const getStatusCounts = () => {
    const counts = { all: applications.length, Pending: 0, Reviewed: 0, Accepted: 0, Rejected: 0 };
    applications.forEach((app) => {
      if (counts[app.status] !== undefined) {
        counts[app.status] += 1;
      }
    });
    return counts;
  };

  const getStatusClass = (status) => {
    const text = String(status || '').toLowerCase();
    if (text === 'pending') return 'status-pending';
    if (text === 'reviewed') return 'status-reviewed';
    if (text === 'accepted') return 'status-accepted';
    if (text === 'rejected') return 'status-rejected';
    return '';
  };

  const hasScheduledInterview = (app) =>
    Boolean(
      app?.interviewScheduledDate ||
      app?.interviewStatus ||
      app?.interviewLocation ||
      app?.interviewMode
    );

  const getInterviewLocationLabel = (app) => {
    const mode = String(app?.interviewMode || '').toLowerCase();
    return mode === 'online' || mode === 'video' ? 'Meeting Link' : 'Location';
  };

  const isUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

  const onUpdateStatus = async (applicationId, status) => {
    try {
      await updateApplicationStatus(applicationId, { status });
      setApplications((prev) =>
        prev.map((app) => (app.applicationId === applicationId ? { ...app, status } : app))
      );
    } catch (error) {
      notify(error?.response?.data?.error || 'Failed to update application status.', 'error');
    }
  };

  return (
    <div className="applications-container">
      <Toast toast={toast} onDismiss={dismissToast} />
      <div className="page-header">
        <div>
          <h1>Applications</h1>
          {!jobId ? <p>View and manage all candidate applications</p> : <p>Applications for this specific job</p>}
        </div>
        {jobId ? (
          <button className="btn-back" onClick={() => navigate('/company/manage-jobs')}>
            ← Back to Jobs
          </button>
        ) : null}
      </div>

      <div className="status-summary">
        <div className="summary-item">
          <div className="summary-number">{getStatusCounts().all}</div>
          <div className="summary-label">Total</div>
        </div>
        <div className="summary-item pending">
          <div className="summary-number">{getStatusCounts().Pending}</div>
          <div className="summary-label">Pending</div>
        </div>
        <div className="summary-item reviewed">
          <div className="summary-number">{getStatusCounts().Reviewed}</div>
          <div className="summary-label">Reviewed</div>
        </div>
        <div className="summary-item accepted">
          <div className="summary-number">{getStatusCounts().Accepted}</div>
          <div className="summary-label">Accepted</div>
        </div>
        <div className="summary-item rejected">
          <div className="summary-number">{getStatusCounts().Rejected}</div>
          <div className="summary-label">Rejected</div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by candidate name, email, or job title..."
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">All Applications</option>
            <option value="Pending">Pending</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading applications...</p>
        </div>
      ) : (
        <>
          {errorMessage ? (
            <div className="error-message" style={{ padding: '15px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '4px', margin: '20px 0', color: '#c00' }}>
              <strong>Error:</strong> {errorMessage}
            </div>
          ) : null}

          {filteredApplications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No applications found</h3>
              {searchTerm || filterStatus !== 'all' ? (
                <p>Try adjusting your filters or search term</p>
              ) : (
                <p>No one has applied yet. Share your job postings!</p>
              )}
            </div>
          ) : (
            <div className="applications-list">
              {filteredApplications.map((app) => (
                <div key={app.applicationId} className="application-card">
                  <div className="candidate-section">
                    <div className="candidate-avatar">{(app.candidateName || 'U').charAt(0)}</div>
                    <div className="candidate-info">
                      <h3>{app.candidateName || 'Unknown Candidate'}</h3>
                      <p className="candidate-email">📧 {app.candidateEmail || 'No email'}</p>
                      {app.candidatePhone ? <p className="candidate-phone">📱 {app.candidatePhone}</p> : null}
                      <p className="candidate-experience">💼 {app.experienceYears || 0} years experience</p>
                    </div>
                  </div>

                  <div className="application-details">
                    <div className="detail-row">
                      <span className="detail-label">Job:</span>
                      <span className="detail-value">{app.jobTitle || 'Job Title'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Applied:</span>
                      <span className="detail-value">{app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '-'}</span>
                    </div>
                    {app.candidateSkills ? (
                      <div className="detail-row">
                        <span className="detail-label">Skills:</span>
                        <span className="detail-value">{app.candidateSkills}</span>
                      </div>
                    ) : null}
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className={`status-badge ${getStatusClass(app.status)}`}>{app.status || 'Unknown'}</span>
                    </div>
                    {hasScheduledInterview(app) ? (
                      <div className="interview-summary-box">
                        <div className="detail-row">
                          <span className="detail-label">Interview:</span>
                          <span className="detail-value interview-detail-value">
                            {new Date(app.interviewScheduledDate).toLocaleString()}
                          </span>
                        </div>
                        {app.interviewLocation ? (
                          <div className="detail-row">
                            <span className="detail-label">{getInterviewLocationLabel(app)}:</span>
                            <span className="detail-value interview-detail-value">
                              {isUrl(app.interviewLocation) ? (
                                <a href={app.interviewLocation} target="_blank" rel="noreferrer">
                                  Open meeting link
                                </a>
                              ) : (
                                app.interviewLocation
                              )}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div className="application-actions">
                    <button
                      onClick={() => navigate(`/company/application-details/${app.applicationId}`)}
                      className="btn-action btn-view"
                    >
                      👁️ View Details
                    </button>

                    {app.status === 'Pending' ? (
                      <div className="status-actions">
                        <button className="btn-action btn-accept" onClick={() => onUpdateStatus(app.applicationId, 'Reviewed')}>
                          ✓ Mark Reviewed
                        </button>
                      </div>
                    ) : null}

                    {app.status === 'Reviewed' ? (
                      <div className="status-actions">
                        <button className="btn-action btn-accept" onClick={() => onUpdateStatus(app.applicationId, 'Accepted')}>
                          ✓ Accept
                        </button>
                        <button className="btn-action btn-reject" onClick={() => onUpdateStatus(app.applicationId, 'Rejected')}>
                          ✗ Reject
                        </button>
                      </div>
                    ) : null}

                    {app.status === 'Accepted' && !hasScheduledInterview(app) ? (
                      <button
                        onClick={() => navigate(`/company/schedule-interview/${app.applicationId}`)}
                        className="btn-action btn-interview"
                      >
                        📅 Schedule Interview
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ViewApplicationsPage;
