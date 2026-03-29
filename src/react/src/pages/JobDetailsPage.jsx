import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { applyForJob, getCandidateApplications, getJobById } from '../services/candidateService';
import { Toast, useDialog } from '../components/Dialog';
import { toPublicFileUrl } from '../utils/media';
import '../../../app/candidate/job-details/job-details.css';

function JobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const { notify, toast, dismissToast } = useDialog();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [jobData, applicationsData] = await Promise.all([
          getJobById(id),
          getCandidateApplications()
        ]);
        setJob(jobData || null);
        setApplications(Array.isArray(applicationsData) ? applicationsData : []);
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const hasApplied = useMemo(
    () => applications.some((item) => String(item.jobId) === String(id)),
    [applications, id]
  );

  const requirements = useMemo(() => {
    const source = String(job?.requirements || '').trim();
    if (!source) return [];
    return source
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [job?.requirements]);

  const companyLogoUrl = useMemo(
    () => toPublicFileUrl(job?.logo),
    [job?.logo]
  );

  const handleApply = async () => {
    if (!job || applying || hasApplied) {
      return;
    }

    setApplying(true);
    try {
      await applyForJob(job.jobId || id);
      const refreshed = await getCandidateApplications();
      setApplications(Array.isArray(refreshed) ? refreshed : []);
      notify('Application submitted successfully.');
    } catch (error) {
      notify(error?.response?.data?.error || 'Failed to submit application.', 'error');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="job-details-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="job-details-container">
      <Toast toast={toast} onDismiss={dismissToast} />
      {!loading && job ? (
        <div className="content-wrapper">
          <button onClick={() => navigate('/candidate/browse-jobs')} className="btn-back">
            ← Back to Jobs
          </button>

          <div className="job-header-card">
            <div className="header-content">
              {companyLogoUrl ? (
                <img src={companyLogoUrl} alt={job.companyName || 'Company'} className="company-logo-large" />
              ) : (
                <div className="company-logo-large">{(job.companyName || 'C').charAt(0)}</div>
              )}
              <div className="header-info">
                <h1>{job.title}</h1>
                <h2>{job.companyName}</h2>
                <div className="header-details">
                  <span className="detail-badge">📍 {job.location}</span>
                  <span className="detail-badge">💼 {job.employmentType}</span>
                  <span className="detail-badge">💰 {job.salaryRange || 'Not specified'}</span>
                  <span className="detail-badge">
                    📅 Posted {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="header-actions">
              {!hasApplied ? (
                <button onClick={handleApply} disabled={applying} className="btn-apply">
                  {applying ? 'Submitting...' : 'Apply Now'}
                </button>
              ) : (
                <button className="btn-applied" disabled>✓ Already Applied</button>
              )}
            </div>
          </div>

          <div className="content-grid">
            <div className="left-column">
              <div className="section-card">
                <h3>Job Description</h3>
                <p className="description-text">{job.description}</p>
              </div>

              <div className="section-card">
                <h3>Requirements</h3>
                {requirements.length ? (
                  <ul className="requirements-list">
                    {requirements.map((requirement) => (
                      <li key={requirement}>
                        <span className="check-icon">✓</span>
                        {requirement}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="description-text">No specific requirements listed.</p>
                )}
              </div>
            </div>

            <div className="right-column">
              <div className="sticky-card apply-card">
                <h3>Ready to Apply?</h3>
                <p>Join {job.companyName} and advance your career</p>
                {!hasApplied ? (
                  <button onClick={handleApply} disabled={applying} className="btn-apply-full">
                    {applying ? 'Submitting...' : 'Apply for this Position'}
                  </button>
                ) : (
                  <button className="btn-applied-full" disabled>✓ Application Submitted</button>
                )}
              </div>

              <div className="sticky-card info-card">
                <h3>Job Information</h3>
                <div className="info-list">
                  <div className="info-item"><span className="info-label">Job Type:</span><span className="info-value">{job.employmentType}</span></div>
                  <div className="info-item"><span className="info-label">Location:</span><span className="info-value">{job.location}</span></div>
                  <div className="info-item"><span className="info-label">Salary Range:</span><span className="info-value">{job.salaryRange || 'Not specified'}</span></div>
                  <div className="info-item"><span className="info-label">Posted:</span><span className="info-value">{job.postedAt ? new Date(job.postedAt).toLocaleDateString() : '-'}</span></div>
                  <div className="info-item"><span className="info-label">Deadline:</span><span className="info-value">{job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Open'}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && !job ? (
        <div className="error-state">
          <h3>Job Not Found</h3>
          <p>The job you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/candidate/browse-jobs')} className="btn-primary">Browse Jobs</button>
        </div>
      ) : null}
    </div>
  );
}

export default JobDetailsPage;
