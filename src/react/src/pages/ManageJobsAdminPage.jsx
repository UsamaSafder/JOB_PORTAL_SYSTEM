import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteJob, getAllJobs, toggleJobStatus } from '../services/jobsService';
import { DialogModal, Toast, useDialog } from '../components/Dialog';
import '../../../app/admin/manage-jobs/manage-jobs-admin.css';

function ManageJobsAdminPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const { notify, confirm, toast, modal, dismissToast, handleModalResult } = useDialog();

  const loadJobs = async () => {
    setErrorMessage('');
    try {
      const data = await getAllJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(error?.response?.data?.error || 'Failed to load jobs.');
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesSearch =
        !term ||
        (job.title || '').toLowerCase().includes(term) ||
        (job.companyName || '').toLowerCase().includes(term) ||
        (job.location || '').toLowerCase().includes(term);

      const matchesType = filterType === 'all' || (job.employmentType || '') === filterType;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && job.isActive) ||
        (filterStatus === 'inactive' && !job.isActive);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [filterStatus, filterType, jobs, searchTerm]);

  const getActiveJobs = () => jobs.filter((job) => job.isActive).length;
  const getTotalApplications = () =>
    jobs.reduce((sum, job) => sum + Number(job.applicationsCount || 0), 0);
  const getJobsByType = (type) => jobs.filter((job) => job.employmentType === type).length;

  const isDeadlineNear = (deadline) => {
    if (!deadline) return false;
    const now = new Date();
    const target = new Date(deadline);
    const diffMs = target.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 7;
  };

  const updateJobInState = (jobId, updater) => {
    setJobs((prev) => prev.map((job) => (job.jobId === jobId ? { ...job, ...updater(job) } : job)));
    setSelectedJob((prev) => {
      if (!prev || prev.jobId !== jobId) return prev;
      return { ...prev, ...updater(prev) };
    });
  };

  const onToggleStatus = async (job) => {
    try {
      const response = await toggleJobStatus(job.jobId);
      const updated = response?.job;

      if (updated && updated.jobId) {
        updateJobInState(updated.jobId, () => updated);
      } else {
        updateJobInState(job.jobId, (current) => ({ isActive: !current.isActive }));
      }
    } catch (error) {
      notify(error?.response?.data?.error || 'Failed to update job status.', 'error');
    }
  };

  const onDeleteJob = async (job) => {
    const ok = await confirm(`Delete job "${job.title}"?`, 'This action cannot be undone.');
    if (!ok) return;

    try {
      await deleteJob(job.jobId);
      setJobs((prev) => prev.filter((item) => item.jobId !== job.jobId));
      if (selectedJob?.jobId === job.jobId) setSelectedJob(null);
      notify('Job deleted successfully.');
    } catch (error) {
      notify(error?.response?.data?.error || 'Failed to delete job.', 'error');
    }
  };

  const viewApplications = (job) => {
    navigate(`/company/applications/${job.jobId}`);
  };

  return (
    <div className="manage-jobs">
      <Toast toast={toast} onDismiss={dismissToast} />
      <DialogModal modal={modal} onResult={handleModalResult} />
      <div className="header">
        <h2>Manage Jobs</h2>
        <div className="search-filter">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, company, or location..."
            className="search-input"
          />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
            <option value="all">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {errorMessage ? <div className="no-data">{errorMessage}</div> : null}

      <div className="stats-cards">
        <div className="stat-card total">
          <h3>Total Jobs</h3>
          <p className="stat-number">{jobs.length}</p>
        </div>
        <div className="stat-card active">
          <h3>Active Jobs</h3>
          <p className="stat-number">{getActiveJobs()}</p>
        </div>
        <div className="stat-card applications">
          <h3>Total Applications</h3>
          <p className="stat-number">{getTotalApplications()}</p>
        </div>
        <div className="stat-card fulltime">
          <h3>Full-time Positions</h3>
          <p className="stat-number">{getJobsByType('Full-time')}</p>
        </div>
      </div>

      <div className="table-container">
        <table className="jobs-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Job Title</th>
              <th>Company</th>
              <th>Location</th>
              <th>Type</th>
              <th>Salary Range</th>
              <th>Applications</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map((job) => (
              <tr key={job.jobId}>
                <td>{job.jobId}</td>
                <td>
                  <div className="job-title">
                    <strong>{job.title}</strong>
                  </div>
                </td>
                <td>{job.companyName || '-'}</td>
                <td>{job.location || '-'}</td>
                <td>
                  <span className={`type-badge ${(job.employmentType || '').toLowerCase()}`}>
                    {job.employmentType || '-'}
                  </span>
                </td>
                <td>{job.salaryRange || '-'}</td>
                <td className="text-center">
                  <span className="applications-count">{job.applicationsCount || 0}</span>
                </td>
                <td>
                  <span className={`deadline ${isDeadlineNear(job.deadline) ? 'near' : ''}`}>
                    {job.deadline ? new Date(job.deadline).toLocaleDateString() : '-'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${job.isActive ? 'active' : 'inactive'}`}>
                    {job.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="actions">
                  <button onClick={() => setSelectedJob(job)} className="btn-view" title="View Details">
                    <i className="icon">👁️</i>
                  </button>
                  <button
                    onClick={() => onToggleStatus(job)}
                    className={`btn-toggle ${job.isActive ? 'deactivate' : 'activate'}`}
                    title={job.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <i className="icon">{job.isActive ? '🔒' : '✓'}</i>
                  </button>
                  <button onClick={() => onDeleteJob(job)} className="btn-delete" title="Delete">
                    <i className="icon">🗑️</i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredJobs.length === 0 ? (
          <div className="no-data">
            <p>No jobs found matching your criteria.</p>
          </div>
        ) : null}
      </div>

      {selectedJob ? (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Job Details</h3>
              <button className="close-btn" onClick={() => setSelectedJob(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Job Information</h4>
                <div className="detail-row">
                  <span className="label">Job Title:</span>
                  <span className="value"><strong>{selectedJob.title}</strong></span>
                </div>
                <div className="detail-row">
                  <span className="label">Company:</span>
                  <span className="value">{selectedJob.companyName || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Location:</span>
                  <span className="value">{selectedJob.location || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Employment Type:</span>
                  <span className="value">
                    <span className={`type-badge ${(selectedJob.employmentType || '').toLowerCase()}`}>
                      {selectedJob.employmentType || '-'}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Salary Range:</span>
                  <span className="value">{selectedJob.salaryRange || '-'}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Job Description</h4>
                <p className="description">{selectedJob.description || '-'}</p>
              </div>

              <div className="detail-section">
                <h4>Requirements</h4>
                <p className="description">{selectedJob.requirements || '-'}</p>
              </div>

              <div className="detail-section">
                <h4>Application Details</h4>
                <div className="detail-row">
                  <span className="label">Total Applications:</span>
                  <span className="value">
                    <span className="applications-count large">{selectedJob.applicationsCount || 0}</span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Application Deadline:</span>
                  <span className="value">
                    <span className={`deadline ${isDeadlineNear(selectedJob.deadline) ? 'near' : ''}`}>
                      {selectedJob.deadline
                        ? new Date(selectedJob.deadline).toLocaleDateString(undefined, {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : '-'}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Posted On:</span>
                  <span className="value">
                    {selectedJob.postedAt ? new Date(selectedJob.postedAt).toLocaleString() : '-'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className="value">
                    <span className={`status-badge ${selectedJob.isActive ? 'active' : 'inactive'}`}>
                      {selectedJob.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={() => viewApplications(selectedJob)} className="btn-action applications">
                  View Applications ({selectedJob.applicationsCount || 0})
                </button>
                <button
                  onClick={() => onToggleStatus(selectedJob)}
                  className={`btn-action ${selectedJob.isActive ? 'deactivate' : 'activate'}`}
                >
                  {selectedJob.isActive ? 'Deactivate Job' : 'Activate Job'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ManageJobsAdminPage;
