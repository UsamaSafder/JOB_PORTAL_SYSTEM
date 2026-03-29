import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCandidateInterviews } from '../services/candidateService';
import '../../../app/candidate/my-interviews/my-interviews.css';

function MyInterviewsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCandidateInterviews();
        setInterviews(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const now = Date.now();

  const upcomingInterviews = useMemo(
    () => interviews.filter((item) => !item.scheduledDate || new Date(item.scheduledDate).getTime() >= now),
    [interviews, now]
  );

  const pastInterviews = useMemo(
    () => interviews.filter((item) => item.scheduledDate && new Date(item.scheduledDate).getTime() < now),
    [interviews, now]
  );

  const getStatusClass = (status) => {
    const text = String(status || '').toLowerCase();
    if (text.includes('complete')) return 'status-completed';
    if (text.includes('cancel')) return 'status-cancelled';
    return 'status-completed';
  };

  const formatDate = (value, withWeekday = false) => {
    if (!value) return 'Not scheduled yet';
    const options = withWeekday
      ? { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' };
    return new Date(value).toLocaleString(undefined, options);
  };

  return (
    <div className="interviews-container">
      <div className="page-header">
        <h2>My Interviews</h2>
        <p>View and manage your scheduled interviews</p>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading interviews...</p>
        </div>
      ) : null}

      {!loading ? (
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({upcomingInterviews.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past ({pastInterviews.length})
          </button>
        </div>
      ) : null}

      {!loading && activeTab === 'upcoming' ? (
        <>
          {upcomingInterviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No Upcoming Interviews</h3>
              <p>You don't have any scheduled interviews at the moment</p>
              <Link to="/candidate/browse-jobs" className="btn-primary">Browse Jobs</Link>
            </div>
          ) : (
            <div className="interviews-list">
              {upcomingInterviews.map((interview) => (
                <div key={interview.interviewId} className="interview-card upcoming">
                  <div className="card-header">
                    <div className="company-logo">{(interview.companyName || 'C').charAt(0)}</div>
                    <div className="interview-info">
                      <h3>{interview.jobTitle}</h3>
                      <p className="company-name">{interview.companyName}</p>
                    </div>
                    <span className="status-badge status-upcoming">📅 Upcoming</span>
                  </div>

                  <div className="card-body">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-icon">📅</span>
                        <div>
                          <p className="info-label">Date & Time</p>
                          <p className="info-value">{formatDate(interview.scheduledDate, true)}</p>
                          <p className="info-value">{interview.scheduledDate ? new Date(interview.scheduledDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Not scheduled yet'}</p>
                        </div>
                      </div>

                      <div className="info-item">
                        <span className="info-icon">⏱️</span>
                        <div>
                          <p className="info-label">Duration</p>
                          <p className="info-value">{interview.duration || 30} minutes</p>
                        </div>
                      </div>

                      <div className="info-item">
                        <span className="info-icon">📍</span>
                        <div>
                          <p className="info-label">Location/Link</p>
                          <p className="info-value">{interview.location || 'Virtual'}</p>
                        </div>
                      </div>

                      <div className="info-item">
                        <span className="info-icon">👤</span>
                        <div>
                          <p className="info-label">Interviewer</p>
                          <p className="info-value">{interview.interviewerName || 'TBD'}</p>
                        </div>
                      </div>
                    </div>

                    {interview.notes ? (
                      <div className="notes-section">
                        <h4>Interview Notes:</h4>
                        <p>{interview.notes}</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="card-footer">
                    {interview.meetingLink ? (
                      <button className="btn-join" onClick={() => window.open(interview.meetingLink, '_blank', 'noopener,noreferrer')}>
                        Join Interview
                      </button>
                    ) : null}
                    <Link to={`/candidate/job-details/${interview.jobId}`} className="btn-view">View Job</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}

      {!loading && activeTab === 'past' ? (
        <>
          {pastInterviews.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No Past Interviews</h3>
              <p>Your interview history will appear here</p>
            </div>
          ) : (
            <div className="interviews-list">
              {pastInterviews.map((interview) => (
                <div key={interview.interviewId} className="interview-card past">
                  <div className="card-header">
                    <div className="company-logo">{(interview.companyName || 'C').charAt(0)}</div>
                    <div className="interview-info">
                      <h3>{interview.jobTitle}</h3>
                      <p className="company-name">{interview.companyName}</p>
                    </div>
                    <span className={`status-badge ${getStatusClass(interview.status)}`}>
                      {interview.status || 'Completed'}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-icon">📅</span>
                        <div>
                          <p className="info-label">Interview Date</p>
                          <p className="info-value">{formatDate(interview.scheduledDate)}</p>
                        </div>
                      </div>

                      <div className="info-item">
                        <span className="info-icon">⏱️</span>
                        <div>
                          <p className="info-label">Duration</p>
                          <p className="info-value">{interview.duration || 30} minutes</p>
                        </div>
                      </div>
                    </div>

                    {interview.feedback ? (
                      <div className="feedback-section">
                        <h4>Feedback:</h4>
                        <p>{interview.feedback}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

export default MyInterviewsPage;
