import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompanyJobs } from '../services/companyService';
import { deleteJob, toggleJobStatus } from '../services/jobsService';
import { DialogModal, Toast, useDialog } from '../components/Dialog';
import '../../../app/company/manage-jobs/manage-jobs.css';

function ManageJobsCompanyPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const { notify, confirm, toast, modal, dismissToast, handleModalResult } = useDialog();

  const loadJobs = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await getCompanyJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(error?.response?.data?.error || 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline).getTime() < Date.now();
  };

  const getJobStatusMeta = (job) => {
    if (!job?.isActive) {
      return { label: 'Inactive', className: 'inactive', key: 'inactive' };
    }

    if (isDeadlinePassed(job?.deadline)) {
      return { label: 'Expired', className: 'expired', key: 'expired' };
    }

    return { label: 'Active', className: 'active', key: 'active' };
  };

  const filteredJobs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSearch =
        !term ||
        (job.title || '').toLowerCase().includes(term) ||
        (job.location || '').toLowerCase().includes(term);

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && getJobStatusMeta(job).key === 'active') ||
        (filterStatus === 'inactive' && getJobStatusMeta(job).key !== 'active');

      return matchesSearch && matchesStatus;
    });
  }, [filterStatus, jobs, searchTerm]);

  const onToggleJobStatus = async (job) => {
    try {
      const response = await toggleJobStatus(job.jobId);
      const updated = response?.job;

      setJobs((prev) =>
        prev.map((item) => {
          if (item.jobId !== job.jobId) return item;
          if (updated?.jobId) return { ...item, ...updated };
          return { ...item, isActive: !item.isActive };
        })
      );
    } catch (error) {
      notify(error?.response?.data?.error || 'Failed to update job status.', 'error');
    }
  };

  const onDeleteJob = async (jobId) => {
    const ok = await confirm('Delete this job posting?', 'This action cannot be undone.');
    if (!ok) return;
    try {
      await deleteJob(jobId);
      setJobs((prev) => prev.filter((job) => job.jobId !== jobId));
      notify('Job deleted successfully.');
    } catch (error) {
      notify(error?.response?.data?.error || 'Failed to delete job.', 'error');
    }
  };

  return (
    <div className="manage-jobs-container">
      <Toast toast={toast} onDismiss={dismissToast} />
      <DialogModal modal={modal} onResult={handleModalResult} />
      <div className="header">
        <div className="header-content">
          <h1>Manage Jobs</h1>
          <button className="btn-primary" onClick={() => navigate('/company/post-job')}>
            + Post New Job
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by job title or location..."
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Jobs</option>
          <option value="active">Active Jobs</option>
          <option value="inactive">Inactive Jobs</option>
        </select>
      </div>

      {errorMessage ? <div className="empty-state"><p>{errorMessage}</p></div> : null}

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading jobs...</p>
        </div>
      ) : (
        <>
          {filteredJobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No jobs found</h3>
              {jobs.length === 0 ? (
                <p>You haven't posted any jobs yet.</p>
              ) : (
                <p>Try adjusting your filters or search terms.</p>
              )}
              {jobs.length === 0 ? (
                <button className="btn-primary" onClick={() => navigate('/company/post-job')}>
                  Post Your First Job
                </button>
              ) : null}
            </div>
          ) : (
            <div className="jobs-grid">
              {filteredJobs.map((job) => (
                (() => {
                  const statusMeta = getJobStatusMeta(job);
                  return (
                <div key={job.jobId} className="job-card">
                  <div className="job-header">
                    <div className="job-title-section">
                      <h3>{job.title}</h3>
                      <span className={`status-badge ${statusMeta.className}`}>
                        ● {statusMeta.label}
                      </span>
                    </div>
                    <div className="job-actions">
                      <button
                        className="action-btn edit"
                        onClick={() => navigate(`/company/post-job?jobId=${job.jobId}`)}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button className="action-btn delete" onClick={() => onDeleteJob(job.jobId)} title="Delete">
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className="job-details">
                    <div className="detail-item">
                      <span className="icon">📍</span>
                      <span>{job.location || 'Location not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="icon">💼</span>
                      <span>{job.employmentType}</span>
                    </div>
                    <div className="detail-item">
                      <span className="icon">💰</span>
                      <span>{job.salaryRange || 'Not specified'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="icon">📅</span>
                      <span>Posted: {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : '-'}</span>
                    </div>
                    {job.deadline ? (
                      <div className="detail-item">
                        <span className="icon">⏰</span>
                        <span className={isDeadlinePassed(job.deadline) ? 'deadline-passed' : ''}>
                          Deadline: {new Date(job.deadline).toLocaleDateString()}
                          {isDeadlinePassed(job.deadline) ? <span className="expired-label"> (Expired)</span> : null}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="job-description">
                    <p>
                      {(job.description || '').substring(0, 150)}
                      {(job.description || '').length > 150 ? '...' : ''}
                    </p>
                  </div>

                  <div className="job-footer">
                    <button className="btn-secondary" onClick={() => navigate(`/company/applications/${job.jobId}`)}>
                      📄 View Applications
                    </button>
                    <button
                      className={`btn-toggle ${!job.isActive ? 'activate' : 'deactivate'}`}
                      onClick={() => onToggleJobStatus(job)}
                    >
                      {job.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ManageJobsCompanyPage;
