import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getApplicationById, scheduleInterview } from '../services/companyService';
import '../../../app/company/schedule-interview/schedule-interview.css';

function ScheduleInterviewPage() {
  const navigate = useNavigate();
  const { applicationId } = useParams();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [values, setValues] = useState({
    mode: 'Online',
    scheduledDate: '',
    scheduledTime: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    const loadApplication = async () => {
      try {
        const data = await getApplicationById(applicationId);
        setApplication(data || null);
      } catch (error) {
        setErrorMessage(error?.response?.data?.error || 'Failed to load application.');
      }
    };

    loadApplication();
  }, [applicationId]);

  const errors = useMemo(() => {
    const next = {};
    if (!values.scheduledDate) next.scheduledDate = 'Date is required';
    if (!values.scheduledTime) next.scheduledTime = 'Time is required';
    if (values.mode === 'Onsite' && !values.location) {
      next.location = 'Location is required for onsite interviews';
    }
    return next;
  }, [values]);

  const getMinDate = () => new Date().toISOString().slice(0, 10);

  const onCancel = () => navigate(`/company/application-details/${applicationId}`);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const currentCompany = JSON.parse(localStorage.getItem('currentCompany') || '{}');
      const interviewerName =
        currentCompany.companyName || currentUser.companyName || currentUser.email || 'Company HR';

      const interviewDateIso = `${values.scheduledDate}T${values.scheduledTime}:00`;
      const interviewType = values.mode === 'Online' ? 'video' : 'in-person';

      await scheduleInterview(applicationId, {
        interviewDate: interviewDateIso,
        scheduledDate: interviewDateIso,
        mode: values.mode,
        interviewType,
        interviewerName,
        location: values.location,
        notes: values.notes
      });

      setSuccessMessage('Interview scheduled successfully!');
      setTimeout(() => navigate(`/company/application-details/${applicationId}`), 1200);
    } catch (error) {
      if (Array.isArray(error?.response?.data?.errors)) {
        setErrorMessage(error.response.data.errors.map((e) => e.msg).join(', '));
      } else {
        setErrorMessage(error?.response?.data?.error || 'Failed to schedule interview.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="schedule-container">
      <div className="form-header">
        <button className="btn-back" onClick={() => navigate(`/company/application-details/${applicationId}`)}>
          ← Back to Application
        </button>
        <h1>Schedule Interview</h1>
        {application ? (
          <p>
            Schedule an interview with <strong>{application.candidateName}</strong> for{' '}
            <strong>{application.jobTitle}</strong>
          </p>
        ) : null}
      </div>

      {application ? (
        <div className="candidate-card">
          <div className="candidate-avatar">{(application.candidateName || 'U').charAt(0)}</div>
          <div className="candidate-info">
            <h3>{application.candidateName || 'Unknown Candidate'}</h3>
            <p>📧 {application.candidateEmail || '-'}</p>
            {application.candidatePhone ? <p>📱 {application.candidatePhone}</p> : null}
          </div>
        </div>
      ) : null}

      {successMessage ? <div className="alert alert-success">✓ {successMessage}</div> : null}
      {errorMessage ? <div className="alert alert-error">✗ {errorMessage}</div> : null}

      <form onSubmit={onSubmit} className="interview-form">
        <div className="form-group">
          <label htmlFor="mode">Interview Mode *</label>
          <div className="mode-options">
            {['Online', 'Onsite'].map((mode) => (
              <label className="mode-option" key={mode}>
                <input
                  type="radio"
                  name="mode"
                  value={mode}
                  checked={values.mode === mode}
                  onChange={(e) => setValues((prev) => ({ ...prev, mode: e.target.value }))}
                />
                <div className="mode-card">
                  <span className="mode-icon">{mode === 'Online' ? '💻' : '🏢'}</span>
                  <span className="mode-label">{mode}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="scheduledDate">Interview Date *</label>
            <input
              type="date"
              id="scheduledDate"
              className={`form-control ${submitted && errors.scheduledDate ? 'invalid' : ''}`}
              min={getMinDate()}
              value={values.scheduledDate}
              onChange={(e) => setValues((prev) => ({ ...prev, scheduledDate: e.target.value }))}
            />
            {submitted && errors.scheduledDate ? <div className="error-message">{errors.scheduledDate}</div> : null}
          </div>

          <div className="form-group">
            <label htmlFor="scheduledTime">Interview Time *</label>
            <input
              type="time"
              id="scheduledTime"
              className={`form-control ${submitted && errors.scheduledTime ? 'invalid' : ''}`}
              value={values.scheduledTime}
              onChange={(e) => setValues((prev) => ({ ...prev, scheduledTime: e.target.value }))}
            />
            {submitted && errors.scheduledTime ? <div className="error-message">{errors.scheduledTime}</div> : null}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">
            Location {values.mode === 'Onsite' ? '*' : ''}{' '}
            {values.mode === 'Online' ? (
              <span className="label-hint">(e.g., Zoom link, Google Meet link)</span>
            ) : null}
          </label>
          <input
            type="text"
            id="location"
            className={`form-control ${submitted && errors.location ? 'invalid' : ''}`}
            placeholder={
              values.mode === 'Online'
                ? 'Enter meeting link or platform details'
                : 'Enter office address or meeting room'
            }
            value={values.location}
            onChange={(e) => setValues((prev) => ({ ...prev, location: e.target.value }))}
          />
          {submitted && errors.location ? <div className="error-message">{errors.location}</div> : null}
        </div>

        <div className="form-group">
          <label htmlFor="notes">Additional Notes (Optional)</label>
          <textarea
            id="notes"
            className="form-control"
            rows="4"
            placeholder="Add any additional information or instructions for the candidate..."
            value={values.notes}
            onChange={(e) => setValues((prev) => ({ ...prev, notes: e.target.value }))}
          ></textarea>
        </div>

        <div className="notice-box">
          <div className="notice-icon">ℹ️</div>
          <div className="notice-content">
            <strong>Important:</strong> The candidate will be notified via email about the interview details. Please
            ensure all information is correct before scheduling.
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {!loading ? '📅 Schedule Interview' : 'Scheduling...'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ScheduleInterviewPage;
