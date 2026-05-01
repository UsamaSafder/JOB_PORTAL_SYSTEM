import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllCandidates,
  getAllCompanies,
  getDashboardStats,
  getSystemLogs,
  toggleUserStatus,
  verifyCompany
} from '../services/adminService';
import { DialogModal, Toast, useDialog } from '../components/Dialog';
import '../../../app/admin/admin-dashboard/admin-dashboard.css';

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statsData, setStatsData] = useState({});
  const [activities, setActivities] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const { notify, confirm, toast, modal, dismissToast, handleModalResult } = useDialog();

  const filteredActivities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return activities;

    return activities.filter((activity) => {
      const userName = (activity.userName || '').toLowerCase();
      const action = (activity.action || '').toLowerCase();
      const userType = (activity.userType || '').toLowerCase();
      return userName.includes(term) || action.includes(term) || userType.includes(term);
    });
  }, [activities, searchTerm]);

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    setErrorMessage('');

    const [statsResult, logsResult, companiesResult, candidatesResult] = await Promise.allSettled([
      getDashboardStats(),
      getSystemLogs(20),
      getAllCompanies(),
      getAllCandidates()
    ]);

    // Stats from dedicated endpoint OR fall back to counting from real data
    const stats = statsResult.status === 'fulfilled' ? (statsResult.value || {}) : {};
    const companies = companiesResult.status === 'fulfilled' && Array.isArray(companiesResult.value)
      ? companiesResult.value : [];
    const candidates = candidatesResult.status === 'fulfilled' && Array.isArray(candidatesResult.value)
      ? candidatesResult.value : [];
    const logs = logsResult.status === 'fulfilled' && Array.isArray(logsResult.value)
      ? logsResult.value : [];

    // Build unified stats — use the dedicated endpoint values when available,
    // fall back to live counts from fetched arrays so numbers are always accurate.
    const derived = {
      totalCompanies: stats.totalCompanies ?? companies.length,
      totalCandidates: stats.totalCandidates ?? candidates.length,
      activeJobs: stats.activeJobs ?? 0,
      totalApplications: stats.totalApplications ?? 0,
      totalJobs: stats.totalJobs ?? 0,
      pendingApplications: stats.pendingApplications ?? 0,
    };

    setStatsData(derived);
    setActivities(logs);
    setPendingVerifications(companies.filter((c) => !c.isVerified));

    if (logsResult.status === 'rejected' && statsResult.status === 'rejected') {
      setErrorMessage('Some dashboard data could not be loaded. Showing available data.');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onVerifyCompany = async (company) => {
    const targetUserId = company?.userId;
    if (!targetUserId) {
      notify('Unable to verify company: missing user identifier.', 'error');
      return;
    }

    try {
      await verifyCompany(targetUserId);
      setPendingVerifications((prev) => prev.filter((item) => item.userId !== targetUserId));
      await loadDashboardData();
      notify('Company verified successfully.');
    } catch (error) {
      notify(error?.response?.data?.error || 'Failed to verify company.', 'error');
    }
  };

  const onRejectCompany = async (company) => {
    const targetUserId = company?.userId;
    if (!targetUserId) {
      notify('Unable to reject company: missing user identifier.', 'error');
      return;
    }

    const ok = await confirm(
      `Reject ${company.companyName || 'this company'}?`,
      'This will deactivate their account.'
    );
    if (!ok) return;

    try {
      if (company.isActive) {
        await toggleUserStatus(targetUserId);
      }
      setPendingVerifications((prev) => prev.filter((item) => item.userId !== targetUserId));
      await loadDashboardData();
      notify('Company rejected successfully.');
    } catch (error) {
      notify(error?.response?.data?.error || 'Failed to reject company.', 'error');
    }
  };

  return (
    <div className="admin-dashboard">
      <Toast toast={toast} onDismiss={dismissToast} />
      <DialogModal modal={modal} onResult={handleModalResult} />
      <div className="header">
        <div className="header-left">
          <h2>📊 Admin Dashboard</h2>
          <p className="subtitle">Monitor your job portal system</p>
        </div>
        <div className="search-filter">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search activities..."
            className="search-input"
          />
          <button className="refresh-btn" onClick={loadDashboardData} disabled={isLoading}>
            {isLoading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {errorMessage ? <div className="empty-state">{errorMessage}</div> : null}

      <div className="stats-cards">
        <div className="stat-card companies">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <p className="stat-label">Total Companies</p>
            <p className="stat-value">{statsData.totalCompanies || 0}</p>
          </div>
        </div>
        <div className="stat-card candidates">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <p className="stat-label">Total Candidates</p>
            <p className="stat-value">{statsData.totalCandidates || 0}</p>
          </div>
        </div>
        <div className="stat-card jobs">
          <div className="stat-icon">💼</div>
          <div className="stat-content">
            <p className="stat-label">Active Jobs</p>
            <p className="stat-value">{statsData.activeJobs || 0}</p>
          </div>
        </div>
        <div className="stat-card applications">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <p className="stat-label">Total Applications</p>
            <p className="stat-value">{statsData.totalApplications || 0}</p>
          </div>
        </div>
      </div>

      <div className="quick-actions-section">
        <h3>⚡ Quick Actions</h3>
        <div className="quick-actions-grid">
          <div className="action-card companies" onClick={() => navigate('/admin/companies')}>
            <span className="action-icon">🏢</span>
            <h4>Manage Companies</h4>
            <p>Review & verify companies</p>
          </div>
          <div className="action-card candidates" onClick={() => navigate('/admin/candidates')}>
            <span className="action-icon">👥</span>
            <h4>Manage Candidates</h4>
            <p>View all job seekers</p>
          </div>
          <div className="action-card jobs" onClick={() => navigate('/admin/jobs')}>
            <span className="action-icon">💼</span>
            <h4>Manage Jobs</h4>
            <p>Monitor job postings</p>
          </div>
          <div className="action-card logs" onClick={() => navigate('/admin/logs')}>
            <span className="action-icon">📋</span>
            <h4>System Logs</h4>
            <p>View system activities</p>
          </div>
          <div className="action-card companies" onClick={() => navigate('/admin/support')}>
            <span className="action-icon">🛟</span>
            <h4>Support Tickets</h4>
            <p>Reply to company issues</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>📊 Recent Activities</h3>
          <button className="view-all-btn" onClick={() => navigate('/admin/logs')}>View All →</button>
        </div>

        {filteredActivities.length > 0 ? (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Type</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredActivities.map((activity, index) => (
                <tr key={`${activity.logID || activity.logId || index}-${activity.timestamp || ''}`}>
                  <td><strong>{activity.userName || 'System'}</strong></td>
                  <td>{activity.action || '-'}</td>
                  <td>
                    <span className={`type-badge type-${activity.userType || 'system'}`}>
                      {activity.userType || 'System'}
                    </span>
                  </td>
                  <td><span className="timestamp">{formatDate(activity.timestamp)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>📭 No activities found</p>
          </div>
        )}
      </div>

      <div className="table-container pending-section">
        <div className="table-header">
          <h3>⏳ Pending Company Verifications</h3>
          {pendingVerifications.length > 0 ? (
            <span className="pending-badge">{pendingVerifications.length} pending</span>
          ) : null}
        </div>

        {pendingVerifications.length > 0 ? (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>Email</th>
                <th>Industry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingVerifications.map((company) => (
                <tr key={company.companyID || company.companyId || company.userId}>
                  <td><strong>{company.companyName}</strong></td>
                  <td>{company.email}</td>
                  <td><span className="industry-badge">{company.industry || '-'}</span></td>
                  <td>
                    <span className="status-badge pending">⏳ Pending</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-verify"
                        onClick={() => onVerifyCompany(company)}
                        title="Verify this company"
                      >
                        ✓ Verify
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => onRejectCompany(company)}
                        title="Reject this company"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state success">
            <p>✅ All companies are verified!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
