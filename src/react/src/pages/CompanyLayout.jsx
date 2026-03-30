import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { logout } from '../services/authService';
import { toPublicFileUrl } from '../utils/media';
import '../../../app/company/company-layout/company-layout.css';

function CompanyLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(() => {
    const fromCompanyStorage = localStorage.getItem('currentCompany');
    if (fromCompanyStorage) {
      try {
        return JSON.parse(fromCompanyStorage);
      } catch {
        return null;
      }
    }

    const user = localStorage.getItem('currentUser');
    if (!user) return null;
    try {
      const parsed = JSON.parse(user);
      return {
        companyName: parsed.companyName || parsed.email || 'Company Portal',
        isVerified: !!parsed.isVerified,
        logo: parsed.logo || null
      };
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const syncCompany = () => {
      const fromCompanyStorage = localStorage.getItem('currentCompany');
      if (fromCompanyStorage) {
        try {
          setCurrentCompany(JSON.parse(fromCompanyStorage));
          return;
        } catch {
          setCurrentCompany(null);
          return;
        }
      }

      const user = localStorage.getItem('currentUser');
      if (!user) {
        setCurrentCompany(null);
        return;
      }

      try {
        const parsed = JSON.parse(user);
        setCurrentCompany({
          companyName: parsed.companyName || parsed.email || 'Company Portal',
          isVerified: !!parsed.isVerified,
          logo: parsed.logo || null
        });
      } catch {
        setCurrentCompany(null);
      }
    };

    window.addEventListener('storage', syncCompany);
    window.addEventListener('user-profile-updated', syncCompany);

    return () => {
      window.removeEventListener('storage', syncCompany);
      window.removeEventListener('user-profile-updated', syncCompany);
    };
  }, []);

  const companyAvatarUrl = useMemo(
    () => toPublicFileUrl(currentCompany?.logo),
    [currentCompany?.logo]
  );

  useEffect(() => {
    setAvatarLoadError(false);
  }, [companyAvatarUrl]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClassName = ({ isActive }) => `nav-item ${isActive ? 'active' : ''}`;

  return (
    <div className="layout-container company-layout">
      <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {isSidebarOpen ? <h2>{currentCompany?.companyName || 'Company Portal'}</h2> : null}
          <button className="toggle-btn" onClick={() => setIsSidebarOpen((prev) => !prev)}>
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/company/dashboard" className={navClassName}>
            <span className="icon">📊</span>
            {isSidebarOpen ? <span className="label">Dashboard</span> : null}
          </NavLink>
          <NavLink to="/company/post-job" className={navClassName}>
            <span className="icon">➕</span>
            {isSidebarOpen ? <span className="label">Post New Job</span> : null}
          </NavLink>
          <NavLink to="/company/manage-jobs" className={navClassName}>
            <span className="icon">📋</span>
            {isSidebarOpen ? <span className="label">Manage Jobs</span> : null}
          </NavLink>
          <NavLink to="/company/applications" className={navClassName}>
            <span className="icon">📄</span>
            {isSidebarOpen ? <span className="label">View Applications</span> : null}
          </NavLink>
          <NavLink to="/company/profile" className={navClassName}>
            <span className="icon">🏢</span>
            {isSidebarOpen ? <span className="label">Company Profile</span> : null}
          </NavLink>
        </nav>

        {null}
      </aside>

      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <button className="header-menu-btn" onClick={() => setIsSidebarOpen((prev) => !prev)}>
              ☰
            </button>
            <h1>Company Portal</h1>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{currentCompany?.companyName || 'Company'}</span>
              {companyAvatarUrl && !avatarLoadError ? (
                <img
                  src={companyAvatarUrl}
                  alt={currentCompany?.companyName || 'Company'}
                  className="user-avatar"
                  onError={() => setAvatarLoadError(true)}
                />
              ) : (
                <div className="user-avatar">{(currentCompany?.companyName || 'C').charAt(0).toLowerCase()}</div>
              )}
            </div>
            <button className="logout-btn header-logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default CompanyLayout;
