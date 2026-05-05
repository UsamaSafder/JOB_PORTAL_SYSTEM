import { useEffect, useMemo, useState } from 'react';
import { deleteCandidate, getAllCandidates, toggleUserStatus } from '../services/adminService';
import { DialogModal, Toast, useDialog } from '../components/Dialog';
import '../../../app/admin/manage-candidates/manage-candidates.css';

function ManageCandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const { notify, confirm, toast, modal, dismissToast, handleModalResult } = useDialog();

  const loadCandidates = async () => {
    setErrorMessage('');
    try {
      const data = await getAllCandidates();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(error?.response?.data?.error || 'Failed to load candidates.');
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const filteredCandidates = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return candidates.filter((candidate) => {
      const matchesSearch =
        !term ||
        (candidate.fullName || '').toLowerCase().includes(term) ||
        (candidate.email || '').toLowerCase().includes(term) ||
        (candidate.skills || '').toLowerCase().includes(term);

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && candidate.isActive) ||
        (filterStatus === 'inactive' && !candidate.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [candidates, filterStatus, searchTerm]);

  const getActiveCandidates = () => candidates.filter((candidate) => candidate.isActive).length;
  const getInactiveCandidates = () => candidates.filter((candidate) => !candidate.isActive).length;

  const getSkillsPreview = (skills) => {
    if (!skills) return '-';
    const text = String(skills);
    return text.length > 35 ? `${text.slice(0, 35)}...` : text;
  };

  const getResumeUrl = (fileUrl) => {
    if (!fileUrl) return '';
    const normalized = String(fileUrl).replace(/\\/g, '/');
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      return normalized;
    }
    return `http://localhost:5001/${normalized.replace(/^\/+/g, '')}`;
  };

  const updateCandidateInState = (userId, updater) => {
    setCandidates((prev) =>
      prev.map((candidate) => (candidate.userId === userId ? { ...candidate, ...updater(candidate) } : candidate))
    );
    setSelectedCandidate((prev) => {
      if (!prev || prev.userId !== userId) return prev;
      return { ...prev, ...updater(prev) };
    });
  };

  const onToggleStatus = async (candidate) => {
    if (!candidate?.userId) {
      notify('Unable to toggle status: missing user id.', 'error');
      return;
    }

    try {
      const response = await toggleUserStatus(candidate.userId);
      updateCandidateInState(candidate.userId, () => ({ isActive: !!response?.isActive }));
    } catch (error) {
      notify(error?.response?.data?.error || 'Failed to update candidate status.', 'error');
    }
  };

  const onDeleteCandidate = async (candidate) => {
    const name = candidate?.fullName || 'This candidate';
    const ok = await confirm(`Delete ${name}?`, 'This action cannot be undone.');
    if (!ok) return;

    try {
      await deleteCandidate(candidate.userId);
      setCandidates((prev) => prev.filter((item) => item.userId !== candidate.userId));
      if (selectedCandidate?.userId === candidate.userId) setSelectedCandidate(null);
      notify(`${name} has been deleted.`);
    } catch (error) {
      notify(error?.response?.data?.error || 'Failed to delete candidate.', 'error');
    }
  };

  return (
    <div className="manage-candidates">
      <Toast toast={toast} onDismiss={dismissToast} />
      <DialogModal modal={modal} onResult={handleModalResult} />
      <div className="mc-topbar">
        <div className="mc-title-wrap">
          <div>
            <h2 className="mc-title">Manage Candidates</h2>
            <p className="mc-subtitle">Review profiles, track status, and manage candidate access</p>
          </div>
        </div>

        <div className="mc-search-filter">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or skills..."
            className="mc-search-input"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="mc-filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {errorMessage ? <div className="mc-no-data">{errorMessage}</div> : null}

      <div className="mc-stats-cards">
        <div className="mc-stat-card total">
          <p className="mc-stat-title">Total Candidates</p>
          <p className="mc-stat-number">{candidates.length}</p>
        </div>
        <div className="mc-stat-card active">
          <p className="mc-stat-title">Active Candidates</p>
          <p className="mc-stat-number">{getActiveCandidates()}</p>
        </div>
        <div className="mc-stat-card inactive">
          <p className="mc-stat-title">Inactive Candidates</p>
          <p className="mc-stat-number">{getInactiveCandidates()}</p>
        </div>
      </div>

      <div className="mc-table-headline">
        <p>Showing {filteredCandidates.length} of {candidates.length} candidates</p>
      </div>

      <div className="mc-table-container">
        <table className="mc-candidates-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Skills</th>
              <th>Experience</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.map((candidate) => (
              <tr key={candidate.candidateID || candidate.candidateId || candidate.userId}>
                <td>{candidate.candidateID || candidate.candidateId || '-'}</td>
                <td>{candidate.fullName || '-'}</td>
                <td>{candidate.email || '-'}</td>
                <td>{candidate.phoneNumber || '-'}</td>
                <td>
                  <span className="mc-skills-preview">{getSkillsPreview(candidate.skills)}</span>
                </td>
                <td>{candidate.experienceYears !== undefined ? candidate.experienceYears : 0} years</td>
                <td>
                  <span className={`mc-status-badge ${candidate.isActive ? 'active' : 'inactive'}`}>
                    {candidate.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : '-'}</td>
                <td className="mc-actions">
                  <button onClick={() => setSelectedCandidate(candidate)} className="mc-btn-view" title="View Details">
                    <i className="icon-view">👁️</i>
                  </button>
                  <button
                    onClick={() => onToggleStatus(candidate)}
                    className={`mc-btn-toggle ${candidate.isActive ? 'deactivate' : 'activate'}`}
                    title={candidate.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <i className="icon-toggle">{candidate.isActive ? '🔒' : '✓'}</i>
                  </button>
                  <button onClick={() => onDeleteCandidate(candidate)} className="mc-btn-delete" title="Delete">
                    <i className="icon-delete">🗑️</i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCandidates.length === 0 ? (
          <div className="mc-no-data">
            <p>No candidates found matching your criteria.</p>
          </div>
        ) : null}
      </div>

      {selectedCandidate ? (
        <div className="mc-modal-overlay" onClick={() => setSelectedCandidate(null)}>
          <div className="mc-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mc-modal-header">
              <h3>Candidate Details</h3>
              <button className="mc-close-btn" onClick={() => setSelectedCandidate(null)}>×</button>
            </div>
            <div className="mc-modal-body">
              <div className="mc-detail-row">
                <span className="mc-label">Full Name:</span>
                <span className="mc-value">{selectedCandidate.fullName || '-'}</span>
              </div>
              <div className="mc-detail-row">
                <span className="mc-label">Email:</span>
                <span className="mc-value">{selectedCandidate.email || '-'}</span>
              </div>
              <div className="mc-detail-row">
                <span className="mc-label">Phone:</span>
                <span className="mc-value">{selectedCandidate.phoneNumber || '-'}</span>
              </div>
              <div className="mc-detail-row">
                <span className="mc-label">Experience:</span>
                <span className="mc-value">{selectedCandidate.experienceYears || 0} years</span>
              </div>
              <div className="mc-detail-row">
                <span className="mc-label">Skills:</span>
                <span className="mc-value">{selectedCandidate.skills || '-'}</span>
              </div>
              <div className="mc-detail-row">
                <span className="mc-label">Resume:</span>
                <span className="mc-value">
                  {selectedCandidate.resumeLink ? (
                    <a
                      href={getResumeUrl(selectedCandidate.resumeLink)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mc-resume-link"
                    >
                      View Resume
                    </a>
                  ) : (
                    'Not uploaded'
                  )}
                </span>
              </div>
              <div className="mc-detail-row">
                <span className="mc-label">Status:</span>
                <span className="mc-value">
                  <span className={`mc-status-badge ${selectedCandidate.isActive ? 'active' : 'inactive'}`}>
                    {selectedCandidate.isActive ? 'Active' : 'Inactive'}
                  </span>
                </span>
              </div>
              <div className="mc-detail-row">
                <span className="mc-label">Joined:</span>
                <span className="mc-value">
                  {selectedCandidate.createdAt
                    ? new Date(selectedCandidate.createdAt).toLocaleString()
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ManageCandidatesPage;
