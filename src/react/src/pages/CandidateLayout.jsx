import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { logout } from '../services/authService';
import { toPublicFileUrl } from '../utils/media';
import '../../../app/candidate/candidate-layout/candidate-layout.css';

function CandidateLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [candidateUser, setCandidateUser] = useState(() => JSON.parse(localStorage.getItem('currentUser') || '{}'));
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      setCandidateUser(JSON.parse(localStorage.getItem('currentUser') || '{}'));
    };

    window.addEventListener('storage', syncUser);
    window.addEventListener('user-profile-updated', syncUser);

    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('user-profile-updated', syncUser);
    };
  }, []);

  const candidateName = useMemo(() => {
    return candidateUser.fullName || candidateUser.firstName || candidateUser.email || 'Candidate';
  }, [candidateUser]);

  const candidateAvatarUrl = useMemo(
    () => toPublicFileUrl(candidateUser.profilePicture),
    [candidateUser.profilePicture]
  );

  useEffect(() => {
    setAvatarLoadError(false);
  }, [candidateAvatarUrl]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClassName = ({ isActive }) => `nav-item ${isActive ? 'active' : ''}`;

  return (
    <div className="layout-container candidate-layout">
      <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {isSidebarOpen ? <h2>Job Portal</h2> : null}
          <button className="toggle-btn" onClick={() => setIsSidebarOpen((prev) => !prev)}>
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/candidate/dashboard" className={navClassName}>
            <span className="icon">📊</span>
            {isSidebarOpen ? <span className="label">Dashboard</span> : null}
          </NavLink>
          <NavLink to="/candidate/messages" className={navClassName}>
            <span className="icon">💬</span>
            {isSidebarOpen ? <span className="label">Messages</span> : null}
          </NavLink>
          <NavLink to="/candidate/browse-jobs" className={navClassName}>
            <span className="icon">🔍</span>
            {isSidebarOpen ? <span className="label">Browse Jobs</span> : null}
          </NavLink>
          <NavLink to="/candidate/my-applications" className={navClassName}>
            <span className="icon">📄</span>
            {isSidebarOpen ? <span className="label">My Applications</span> : null}
          </NavLink>
          <NavLink to="/candidate/my-interviews" className={navClassName}>
            <span className="icon">📅</span>
            {isSidebarOpen ? <span className="label">My Interviews</span> : null}
          </NavLink>
          <NavLink to="/candidate/manage-resume" className={navClassName}>
            <span className="icon">📋</span>
            {isSidebarOpen ? <span className="label">Manage Resume</span> : null}
          </NavLink>
          <NavLink to="/candidate/profile" className={navClassName}>
            <span className="icon">👤</span>
            {isSidebarOpen ? <span className="label">My Profile</span> : null}
          </NavLink>
        </nav>
      </aside>

      <div className="main-content">
        <header className="header">
          <div className="header-left">
            <h1>Candidate Portal</h1>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{candidateName}</span>
              {candidateAvatarUrl && !avatarLoadError ? (
                <img
                  src={candidateAvatarUrl}
                  alt={candidateName}
                  className="user-avatar"
                  onError={() => setAvatarLoadError(true)}
                />
              ) : (
                <div className="user-avatar">{candidateName.charAt(0)}</div>
              )}
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default CandidateLayout;
