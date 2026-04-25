import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApplicationById, updateApplicationStatus } from '../services/companyService';
import { Toast, useDialog } from '../components/Dialog';
import { toPublicFileUrl } from '../utils/media';
import '../../../app/company/application-details/application-details.css';

function ApplicationDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [interview, setInterview] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const { notify, toast, dismissToast } = useDialog();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const data = await getApplicationById(id);
        setApplication(data || null);
        setInterview(data?.interview || null);
      } catch (error) {
        setErrorMessage(error?.response?.data?.error || 'Failed to load application details.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const getStatusClass = (status) => {
    const text = String(status || '').toLowerCase();
    if (text === 'pending') return 'status-pending';
    if (text === 'reviewed') return 'status-reviewed';
    if (text === 'accepted') return 'status-accepted';
    if (text === 'rejected') return 'status-rejected';
    return 'status-default';
  };

  const goBack = () => {
    navigate('/company/applications');
  };

  const onUpdateStatus = async (status) => {
    try {
      await updateApplicationStatus(id, { status });
      setApplication((prev) => (prev ? { ...prev, status } : prev));
    } catch (error) {
      notify(error?.response?.data?.error || 'Failed to update status.', 'error');
    }
  };

  const getResumeUrl = (fileUrl) => {
    if (!fileUrl) return '';

    const normalized = String(fileUrl).replace(/\\/g, '/');
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      return normalized;
    }

    return `http://localhost:5001/${normalized.replace(/^\/+/, '')}`;
  };

  const scheduleInterviewPage = () => {
    navigate(`/company/schedule-interview/${id}`);
  };

  const interviewDateValue = interview?.scheduledDate || interview?.interviewDate || interview?.scheduled_at || null;
  const interviewModeValue = interview?.mode || interview?.interviewType || interview?.interview_mode || '-';
  const interviewLocationValue = interview?.location || interview?.meetingLink || interview?.meeting_link || '';
  const interviewStatusValue = interview?.status || interview?.interviewStatus || 'scheduled';

  const hasInterview = Boolean(interviewDateValue);

  const isResumeFilePath = (filePath) => {
    const value = String(filePath || '').trim().toLowerCase();
    if (!value) return false;
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(value);
    if (isImage) return false;
    return /\.(pdf|doc|docx|rtf|txt)(\?|$)/i.test(value) || value.includes('/uploads/resumes/');
  };

  const resolveResumePath = () => {
    const candidates = [
      application?.resumePath,
      application?.submittedResumePath,
      application?.resumeLink,
      application?.candidateResumeLink
    ];

    const match = candidates.find((item) => isResumeFilePath(item));
    return match ? String(match) : '';
  };

  const resumePath = resolveResumePath();
  const hasResume = Boolean(resumePath);

  const openResume = () => {
    if (!hasResume) {
      notify('Resume not available for this application.', 'error');
      return;
    }

    const resumeUrl = getResumeUrl(resumePath);
    if (!resumeUrl) {
      notify('Resume URL is invalid.', 'error');
      return;
    }

    window.open(resumeUrl, '_blank', 'noopener,noreferrer');
  };

  const downloadResume = async () => {
    if (!hasResume) {
      notify('Resume not available for download.', 'error');
      return;
    }

    const resumeUrl = getResumeUrl(resumePath);
    if (!resumeUrl) {
      notify('Resume URL is invalid.', 'error');
      return;
    }

    try {
      const response = await fetch(resumeUrl, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const fileName = String(resumePath).split('/').pop() || 'resume';

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      notify('Failed to download resume.', 'error');
    }
  };

  return (
    <div className="details-container">
      <Toast toast={toast} onDismiss={dismissToast} />
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading application details...</p>
        </div>
      ) : null}

      {!loading && errorMessage ? (
        <div className="error-container">
          <div className="error-box">
            <h2>❌ Error</h2>
            <p>{errorMessage}</p>
            <button className="btn-back" onClick={goBack}>← Back to Applications</button>
          </div>
        </div>
      ) : null}

      {!loading && !errorMessage && application ? (
        <>
          <div className="details-header">
            <button className="btn-back" onClick={goBack}>← Back to Applications</button>
            <h1>Application Details</h1>
          </div>

          <div className="status-card">
            <div className="status-info">
              <span className="status-label">Current Status:</span>
              <span className={`status-badge ${getStatusClass(application.status)}`}>{application.status}</span>
            </div>

            {application.status !== 'Rejected' ? (
              <div className="status-actions">
                {application.status === 'Pending' ? (
                  <button className="btn-status" onClick={() => onUpdateStatus('Reviewed')}>Mark as Reviewed</button>
                ) : null}
                {application.status === 'Reviewed' ? (
                  <>
                    <button className="btn-status btn-accept" onClick={() => onUpdateStatus('Accepted')}>Accept Application</button>
                    <button className="btn-status btn-reject" onClick={() => onUpdateStatus('Rejected')}>Reject Application</button>
                  </>
                ) : null}
                {application.status === 'Accepted' && !hasInterview ? (
                  <button className="btn-status btn-interview" onClick={scheduleInterviewPage}>📅 Schedule Interview</button>
                ) : null}
              </div>
            ) : null}
          </div>

          {hasInterview ? (
            <div className="interview-card">
              <h3>📅 Interview Scheduled</h3>
              <div className="interview-details">
                <div className="interview-item">
                  <span className="interview-label">Date & Time:</span>
                  <span className="interview-value">
                    {interviewDateValue ? new Date(interviewDateValue).toLocaleString() : '-'}
                  </span>
                </div>
                <div className="interview-item">
                  <span className="interview-label">Mode:</span>
                  <span className="interview-value">{interviewModeValue}</span>
                </div>
                {interviewLocationValue ? (
                  <div className="interview-item">
                    <span className="interview-label">Location:</span>
                    <span className="interview-value">{interviewLocationValue}</span>
                  </div>
                ) : null}
                <div className="interview-item">
                  <span className="interview-label">Status:</span>
                  <span className="interview-value">{interviewStatusValue}</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="content-grid">
            <div className="info-card profile-card">
              <h2>👤 Candidate Information</h2>
              <div className="candidate-header">
                {toPublicFileUrl(application.candidateProfilePicture || application.profilePicture) ? (
                  <img
                    src={toPublicFileUrl(application.candidateProfilePicture || application.profilePicture)}
                    alt={application.candidateName || 'Candidate'}
                    className="candidate-avatar-large candidate-avatar-image"
                  />
                ) : (
                  <div className="candidate-avatar-large">{(application.candidateName || 'U').charAt(0)}</div>
                )}
                <div>
                  <h3>{application.candidateName || 'Unknown Candidate'}</h3>
                  <p className="candidate-subtitle">{application.experienceYears || 0} years of experience</p>
                </div>
              </div>

              <div className="info-section">
                <div className="info-item">
                  <span className="info-icon">📧</span>
                  <div>
                    <div className="info-label">Email</div>
                    <div className="info-value">
                      <a href={`mailto:${application.candidateEmail || ''}`}>{application.candidateEmail || '-'}</a>
                    </div>
                  </div>
                </div>

                {application.candidatePhone ? (
                  <div className="info-item">
                    <span className="info-icon">📱</span>
                    <div>
                      <div className="info-label">Phone</div>
                      <div className="info-value">
                        <a href={`tel:${application.candidatePhone}`}>{application.candidatePhone}</a>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="info-item">
                  <span className="info-icon">💼</span>
                  <div>
                    <div className="info-label">Experience</div>
                    <div className="info-value">{application.experienceYears || 0} years</div>
                  </div>
                </div>

                <div className="info-item">
                  <span className="info-icon">📅</span>
                  <div>
                    <div className="info-label">Applied On</div>
                    <div className="info-value">
                      {application.appliedAt ? new Date(application.appliedAt).toLocaleString() : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {hasResume ? (
                <div className="resume-section">
                  <button className="btn-resume" onClick={downloadResume}>📄 Download Resume</button>
                </div>
              ) : null}
            </div>

            <div className="info-card compact-card">
              <h2>💼 Application Snapshot</h2>
              <div className="snapshot-grid">
                <div className="snapshot-item snapshot-accent">
                  <span className="snapshot-label">Job Title</span>
                  <span className="snapshot-value">{application.jobTitle || '-'}</span>
                </div>
                <div className="snapshot-item">
                  <span className="snapshot-label">Application Status</span>
                  <span className={`status-badge ${getStatusClass(application.status)}`}>{application.status}</span>
                </div>
                <div className="snapshot-item">
                  <span className="snapshot-label">Applied On</span>
                  <span className="snapshot-value">
                    {application.appliedAt ? new Date(application.appliedAt).toLocaleString() : '-'}
                  </span>
                </div>
                <div className="snapshot-item">
                  <span className="snapshot-label">Interview</span>
                  <span className="snapshot-value">
                    {hasInterview ? 'Scheduled' : application.status === 'Accepted' ? 'Ready to schedule' : 'Not available yet'}
                  </span>
                </div>
                {application.jobLocation ? (
                  <div className="snapshot-item">
                    <span className="snapshot-label">Job Location</span>
                    <span className="snapshot-value">{application.jobLocation}</span>
                  </div>
                ) : null}
                {application.salaryRange ? (
                  <div className="snapshot-item">
                    <span className="snapshot-label">Salary</span>
                    <span className="snapshot-value">{application.salaryRange}</span>
                  </div>
                ) : null}
              </div>

              {application.status === 'Accepted' && !hasInterview ? (
                <div className="compact-actions">
                  <button className="btn-action btn-schedule" onClick={scheduleInterviewPage}>
                    📅 Schedule Interview
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="lower-grid">
            <div className="info-card full-width compact-section">
              <h2>🛠️ Skills & Expertise</h2>
              {application.candidateSkills ? (
                <div className="skills-container">
                  {String(application.candidateSkills)
                    .split(',')
                    .map((skill) => (
                      <span key={skill.trim()} className="skill-tag">{skill.trim()}</span>
                    ))}
                </div>
              ) : (
                <p className="no-data">No skills listed</p>
              )}
            </div>

            <div className="info-card full-width compact-section">
              <h2>✉️ Cover Letter</h2>
              {application.coverLetter ? (
                <div className="cover-letter"><p>{application.coverLetter}</p></div>
              ) : (
                <p className="no-data">No cover letter provided</p>
              )}
            </div>
          </div>

          <div className="action-buttons">
            <button className="btn-action btn-resume-inline" onClick={openResume} disabled={!hasResume}>
              📄 {hasResume ? 'Open Resume' : 'Resume Not Available'}
            </button>
          </div>
        </>
      ) : null}

      {!loading && !application ? (
        <div className="empty-state">
          <h3>Application not found</h3>
          <button className="btn-primary" onClick={goBack}>Back to Applications</button>
        </div>
      ) : null}
    </div>
  );
}

export default ApplicationDetailsPage;
