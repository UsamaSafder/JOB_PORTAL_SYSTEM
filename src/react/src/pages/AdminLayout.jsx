import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { logout } from '../services/authService';
import { toPublicFileUrl } from '../utils/media';
import '../../../app/admin/admin-layout/admin-layout-react.css';

function AdminLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [adminUser, setAdminUser] = useState(() => JSON.parse(localStorage.getItem('currentUser') || '{}'));
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  useEffect(() => {
    const syncUser = () => setAdminUser(JSON.parse(localStorage.getItem('currentUser') || '{}'));
    window.addEventListener('storage', syncUser);
    window.addEventListener('user-profile-updated', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('user-profile-updated', syncUser);
    };
  }, []);

  const adminName = useMemo(() => {
    return adminUser.username || adminUser.fullName || adminUser.email || 'Admin';
  }, [adminUser]);

  const adminAvatarUrl = useMemo(
    () => toPublicFileUrl(adminUser.profilePicture || adminUser.logo),
    [adminUser.profilePicture, adminUser.logo]
  );

  useEffect(() => {
    setAvatarLoadError(false);
  }, [adminAvatarUrl]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClassName = ({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`;

  return (
    <div className="admin-layout-container">
      <aside className={`admin-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-header">
          {isSidebarOpen ? <h2>Admin Portal</h2> : null}
          <button className="admin-toggle-btn" onClick={() => setIsSidebarOpen((prev) => !prev)}>
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <NavLink to="/admin/dashboard" className={navClassName}>
            <span className="icon">📊</span>
            {isSidebarOpen ? <span className="label">Dashboard</span> : null}
          </NavLink>
          <NavLink to="/admin/companies" className={navClassName}>
            <span className="icon">🏢</span>
            {isSidebarOpen ? <span className="label">Companies</span> : null}
          </NavLink>
          <NavLink to="/admin/candidates" className={navClassName}>
            <span className="icon">👥</span>
            {isSidebarOpen ? <span className="label">Candidates</span> : null}
          </NavLink>
          <NavLink to="/admin/jobs" className={navClassName}>
            <span className="icon">💼</span>
            {isSidebarOpen ? <span className="label">Jobs</span> : null}
          </NavLink>
          <NavLink to="/admin/logs" className={navClassName}>
            <span className="icon">🧾</span>
            {isSidebarOpen ? <span className="label">System Logs</span> : null}
          </NavLink>
        </nav>
      </aside>

      <div className="admin-main-content">
        <header className="admin-header">
          <div className="admin-header-left">
            <h1>Admin Control Panel</h1>
          </div>
          <div className="admin-header-right">
            <div className="admin-user-info">
              <span className="admin-user-name">{adminName}</span>
              {adminAvatarUrl && !avatarLoadError ? (
                <img
                  src={adminAvatarUrl}
                  alt={adminName}
                  className="admin-user-avatar"
                  onError={() => setAvatarLoadError(true)}
                />
              ) : (
                <div className="admin-user-avatar">{adminName.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <button className="admin-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
