import { useEffect, useMemo, useState } from 'react';
import { getSystemLogs } from '../services/adminService';
import { useDialog, Toast } from '../components/Dialog';
import '../../../app/admin/system-logs/system-logs.css';

function toTitleCase(value) {
  if (!value) return 'System';
  return String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
}

function SystemLogsPage() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUserType, setFilterUserType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, notify, dismissToast } = useDialog();

  const refreshLogs = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const data = await getSystemLogs(1000);
      const normalized = (Array.isArray(data) ? data : []).map((log) => ({
        ...log,
        userType: toTitleCase(log.userType),
        userID: log.userId,
        logID: log.logID || log.logId
      }));
      setLogs(normalized);
      if (normalized.length === 0) {
        notify('No logs found in the database yet.', 'info');
      }
    } catch (error) {
      const msg = error?.response?.data?.error || 'Failed to load system logs.';
      setErrorMessage(msg);
      notify(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const result = logs.filter((log) => {
      const matchesSearch =
        !term ||
        (log.action || '').toLowerCase().includes(term) ||
        (log.userName || '').toLowerCase().includes(term);

      const matchesType = filterUserType === 'all' || log.userType === filterUserType;
      return matchesSearch && matchesType;
    });

    return result;
  }, [filterUserType, logs, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [currentPage, filteredLogs, itemsPerPage]);

  const getLogsByType = (type) => logs.filter((log) => log.userType === type).length;

  const getActionType = (action) => {
    const text = (action || '').toLowerCase();
    if (text.includes('delete') || text.includes('reject')) return 'danger';
    if (text.includes('create') || text.includes('register')) return 'success';
    if (text.includes('update') || text.includes('toggle') || text.includes('verify')) return 'warning';
    return 'info';
  };

  const getActionIcon = (action) => {
    const text = (action || '').toLowerCase();
    if (text.includes('delete') || text.includes('reject')) return '🗑️';
    if (text.includes('create') || text.includes('register')) return '✨';
    if (text.includes('update')) return '✏️';
    if (text.includes('verify')) return '✅';
    if (text.includes('toggle') || text.includes('status')) return '🔁';
    if (text.includes('login')) return '🔐';
    return '📌';
  };

  const getUserTypeIcon = (userType) => {
    if (userType === 'Admin') return '👨‍💼';
    if (userType === 'Candidate') return '👤';
    if (userType === 'Company') return '🏢';
    return '⚙️';
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '-';
    const target = new Date(timestamp);
    const diffMs = Date.now() - target.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  const getRecentLogs = (count) => filteredLogs.slice(0, count);

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system-logs-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify(`Exported ${filteredLogs.length} log entries.`, 'success');
  };

  const clearOldLogs = () => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const before = logs.length;
    setLogs((prev) => prev.filter((log) => new Date(log.timestamp).getTime() >= cutoff));
    setCurrentPage(1);
    notify(`Cleared logs older than 30 days from view.`, 'info');
  };

  return (
    <div className="system-logs">
      <Toast toast={toast} onDismiss={dismissToast} />
      <div className="header">
        <h2>System Logs</h2>
        <div className="actions-bar">
          <button onClick={refreshLogs} className="btn-refresh" disabled={loading}>
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
          <button onClick={exportLogs} className="btn-export">📥 Export Logs</button>
          <button onClick={clearOldLogs} className="btn-clear">🗑️ Clear Old (View)</button>
        </div>
      </div>

      {errorMessage ? <div className="error-banner">⚠️ {errorMessage}</div> : null}

      <div className="filters-section-compact">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="🔍 Search action or username..."
          className="filter-input-compact"
        />
        <select
          value={filterUserType}
          onChange={(e) => {
            setFilterUserType(e.target.value);
            setCurrentPage(1);
          }}
          className="filter-select-compact"
        >
          <option value="all">👥 All Users</option>
          <option value="Admin">👨‍💼 Admin</option>
          <option value="Candidate">👤 Candidate</option>
          <option value="Company">🏢 Company</option>
        </select>
      </div>

      <div className="stats-cards">
        <div className="stat-card logs-total">
          <div className="stat-icon logs-total-icon">📊</div>
          <div className="stat-content">
            <p className="stat-label">Total Logs</p>
            <p className="stat-value">{logs.length}</p>
          </div>
        </div>
        <div className="stat-card logs-admin">
          <div className="stat-icon logs-admin-icon">👨‍💼</div>
          <div className="stat-content">
            <p className="stat-label">Admin Actions</p>
            <p className="stat-value">{getLogsByType('Admin')}</p>
          </div>
        </div>
        <div className="stat-card logs-candidate">
          <div className="stat-icon logs-candidate-icon">👤</div>
          <div className="stat-content">
            <p className="stat-label">Candidate Actions</p>
            <p className="stat-value">{getLogsByType('Candidate')}</p>
          </div>
        </div>
        <div className="stat-card logs-company">
          <div className="stat-icon logs-company-icon">🏢</div>
          <div className="stat-content">
            <p className="stat-label">Company Actions</p>
            <p className="stat-value">{getLogsByType('Company')}</p>
          </div>
        </div>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Activity Log</h3>
          <span className="log-count">Showing {filteredLogs.length} of {logs.length} logs</span>
        </div>

        <table className="logs-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Timestamp</th>
              <th>User Type</th>
              <th>User ID</th>
              <th>User Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map((log) => (
              <tr key={`${log.logID}-${log.timestamp}`}>
                <td>
                  <span className="log-id">#{log.logID}</span>
                </td>
                <td>
                  <div className="timestamp">
                    <span className="relative-time">{formatRelativeTime(log.timestamp)}</span>
                    <span className="full-date">{log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</span>
                  </div>
                </td>
                <td>
                  <span className={`user-type-badge ${(log.userType || 'system').toLowerCase()}`}>
                    {getUserTypeIcon(log.userType)} {log.userType}
                  </span>
                </td>
                <td className="text-center">{log.userID ?? '-'}</td>
                <td>{log.userName || 'N/A'}</td>
                <td>
                  <div className="logs-action-cell">
                    <span className={`logs-action-icon ${getActionType(log.action)}`}>
                      {getActionIcon(log.action)}
                    </span>
                    <span className="logs-action-text">{log.action || '-'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLogs.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📭</div>
            <p>No logs found matching your criteria.</p>
          </div>
        ) : null}

        {filteredLogs.length > 0 ? (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn-page"
            >
              ← Previous
            </button>

            <div className="page-info">
              <span>Page {currentPage} of {totalPages}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="page-size"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn-page"
            >
              Next →
            </button>
          </div>
        ) : null}
      </div>

      <div className="timeline-section">
        <h3>Recent Activity Timeline</h3>
        <div className="timeline">
          {getRecentLogs(10).map((log) => (
            <div key={`timeline-${log.logID}-${log.timestamp}`} className="timeline-item">
              <div className={`timeline-marker ${(log.userType || 'system').toLowerCase()}`}></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className={`user-type-badge small ${(log.userType || 'system').toLowerCase()}`}>
                    {log.userType}
                  </span>
                  <span className="timeline-time">{formatRelativeTime(log.timestamp)}</span>
                </div>
                <p className="timeline-action">{log.action || '-'}</p>
                <p className="timeline-user">by {log.userName || `User #${log.userID ?? '-'}`}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SystemLogsPage;
