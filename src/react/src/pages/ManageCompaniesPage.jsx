import { useEffect, useMemo, useState } from 'react';
import {
  getAllCompanies,
  toggleUserStatus,
  verifyCompany,
  deleteCompany
} from '../services/adminService';
import { DialogModal, Toast, useDialog } from '../components/Dialog';
import '../../../app/admin/manage-companies/manage-companies.css';

function ManageCompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { notify, confirm, toast, modal, dismissToast, handleModalResult } = useDialog();

  const loadCompanies = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await getAllCompanies();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(error?.response?.data?.error || 'Failed to load companies.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const filteredCompanies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return companies.filter((company) => {
      const matchesTerm =
        !term ||
        (company.companyName || '').toLowerCase().includes(term) ||
        (company.industry || '').toLowerCase().includes(term) ||
        (company.location || '').toLowerCase().includes(term);

      const matchesVerified =
        filterVerified === 'all' ||
        (filterVerified === 'verified' && company.isVerified) ||
        (filterVerified === 'unverified' && !company.isVerified);

      return matchesTerm && matchesVerified;
    });
  }, [companies, searchTerm, filterVerified]);

  const toSafeCount = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const getVerifiedCompanies = () => toSafeCount(companies.filter((company) => company.isVerified).length);
  const getUnverifiedCompanies = () => toSafeCount(companies.filter((company) => !company.isVerified).length);
  const getActiveCompanies = () => toSafeCount(companies.filter((company) => company.isActive).length);

  const updateCompanyInState = (userId, updater) => {
    setCompanies((prev) =>
      prev.map((company) => (company.userId === userId ? { ...company, ...updater(company) } : company))
    );
    setSelectedCompany((prev) => {
      if (!prev || prev.userId !== userId) return prev;
      return { ...prev, ...updater(prev) };
    });
  };

  const onVerifyCompany = async (company, isVerified) => {
    if (!company?.userId) {
      notify('Unable to verify company: missing user id.', 'error');
      return;
    }
    try {
      await verifyCompany(company.userId, isVerified);
      updateCompanyInState(company.userId, () => ({ isVerified }));
      notify(isVerified ? 'Company approved successfully.' : 'Company disapproved successfully.');
    } catch (error) {
      notify(error?.response?.data?.error || 'Failed to verify company.', 'error');
    }
  };

  const onToggleStatus = async (company) => {
    if (!company?.userId) {
      notify('Unable to toggle status: missing user id.', 'error');
      return;
    }
    try {
      const response = await toggleUserStatus(company.userId);
      updateCompanyInState(company.userId, () => ({ isActive: !!response?.isActive }));
    } catch (error) {
      notify(error?.response?.data?.error || 'Failed to update company status.', 'error');
    }
  };

  const onDeleteCompany = async (company) => {
    const name = company?.companyName || 'This company';
    if (!company?.userId) {
      notify('Unable to delete company: missing user id.', 'error');
      return;
    }
    const ok = await confirm(
      `Delete "${name}"?`,
      'This will also delete all their jobs and applications. This action cannot be undone.'
    );
    if (!ok) return;
    try {
      await deleteCompany(company.userId);
      setCompanies((prev) => prev.filter((c) => c.userId !== company.userId));
      if (selectedCompany?.userId === company.userId) setSelectedCompany(null);
      notify(`${name} has been deleted successfully.`);
    } catch (error) {
      notify(error?.response?.data?.error || `Failed to delete ${name}.`, 'error');
    }
  };

  const normalizeWebsiteUrl = (website) => {
    if (!website) return '#';
    if (website.startsWith('http://') || website.startsWith('https://')) {
      return website;
    }
    return `https://${website}`;
  };

  return (
    <div className="manage-companies">
      <Toast toast={toast} onDismiss={dismissToast} />
      <DialogModal modal={modal} onResult={handleModalResult} />
      <div className="header">
        <h2>Manage Companies</h2>
        <div className="search-filter">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, industry, or location..."
            className="search-input"
          />
          <select
            value={filterVerified}
            onChange={(e) => setFilterVerified(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Companies</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>
        </div>
      </div>

      {errorMessage ? <div className="no-data">{errorMessage}</div> : null}

      <div className="stats-cards">
        <div className="stat-card total">
          <h3>Total Companies</h3>
          <p className="stat-number">{toSafeCount(companies.length)}</p>
        </div>
        <div className="stat-card verified">
          <h3>Verified Companies</h3>
          <p className="stat-number">{getVerifiedCompanies()}</p>
        </div>
        <div className="stat-card pending">
          <h3>Pending Verification</h3>
          <p className="stat-number">{getUnverifiedCompanies()}</p>
        </div>
        <div className="stat-card active">
          <h3>Active Companies</h3>
          <p className="stat-number">{getActiveCompanies()}</p>
        </div>
      </div>

      <div className="table-container">
        <table className="companies-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Company Name</th>
              <th>Email</th>
              <th>Industry</th>
              <th>Location</th>
              <th>Jobs Posted</th>
              <th>Verified</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map((company) => (
              <tr key={company.companyID || company.companyId || company.userId}>
                <td>{company.companyID || company.companyId || '-'}</td>
                <td>
                  <div className="company-info">
                    <strong>{company.companyName}</strong>
                  </div>
                </td>
                <td>{company.email}</td>
                <td>
                  <span className="industry-badge">{company.industry || '-'}</span>
                </td>
                <td>{company.location || '-'}</td>
                <td className="text-center">{company.jobsPosted || 0}</td>
                <td>
                  <span className={`verify-badge ${company.isVerified ? 'verified' : 'unverified'}`}>
                    {company.isVerified ? '✓ Verified' : '⏳ Pending'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${company.isActive ? 'active' : 'inactive'}`}>
                    {company.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="actions">
                  <button onClick={() => setSelectedCompany(company)} className="btn-view" title="View Details">
                    <i className="icon">👁️</i>
                  </button>
                  {!company.isVerified ? (
                    <button onClick={() => onVerifyCompany(company, true)} className="btn-verify" title="Verify Company">
                      <span>Verify</span>
                    </button>
                  ) : (
                    <button onClick={() => onVerifyCompany(company, false)} className="btn-unverify" title="Disapprove Company">
                      <i className="icon">✕</i>
                    </button>
                  )}
                  <button
                    onClick={() => onToggleStatus(company)}
                    className={`btn-toggle ${company.isActive ? 'deactivate' : 'activate'}`}
                    title={company.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <i className="icon">{company.isActive ? '🔒' : '✓'}</i>
                  </button>
                  <button onClick={() => onDeleteCompany(company)} className="btn-delete" title="Delete">
                    <i className="icon">🗑️</i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && filteredCompanies.length === 0 ? (
          <div className="no-data">
            <p>No companies found matching your criteria.</p>
          </div>
        ) : null}
      </div>

      {selectedCompany ? (
        <div className="modal-overlay" onClick={() => setSelectedCompany(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Company Details</h3>
              <button className="close-btn" onClick={() => setSelectedCompany(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Basic Information</h4>
                <div className="detail-row">
                  <span className="label">Company Name:</span>
                  <span className="value">{selectedCompany.companyName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Email:</span>
                  <span className="value">{selectedCompany.email}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Phone:</span>
                  <span className="value">{selectedCompany.phoneNumber || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Industry:</span>
                  <span className="value">
                    <span className="industry-badge">{selectedCompany.industry || '-'}</span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Location:</span>
                  <span className="value">{selectedCompany.location || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Website:</span>
                  <span className="value">
                    {selectedCompany.website ? (
                      <a
                        href={normalizeWebsiteUrl(selectedCompany.website)}
                        target="_blank"
                        rel="noreferrer"
                        className="website-link"
                      >
                        {selectedCompany.website}
                      </a>
                    ) : (
                      '-'
                    )}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Company Description</h4>
                <p className="description">{selectedCompany.description || 'No description available.'}</p>
              </div>

              <div className="detail-section">
                <h4>Status Information</h4>
                <div className="detail-row">
                  <span className="label">Verification Status:</span>
                  <span className="value">
                    <span className={`verify-badge ${selectedCompany.isVerified ? 'verified' : 'unverified'}`}>
                      {selectedCompany.isVerified ? '✓ Verified' : '⏳ Pending Verification'}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Account Status:</span>
                  <span className="value">
                    <span className={`status-badge ${selectedCompany.isActive ? 'active' : 'inactive'}`}>
                      {selectedCompany.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Jobs Posted:</span>
                  <span className="value">{selectedCompany.jobsPosted || 0}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Registered:</span>
                  <span className="value">
                    {selectedCompany.createdAt
                      ? new Date(selectedCompany.createdAt).toLocaleString()
                      : '-'}
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                {!selectedCompany.isVerified ? (
                  <button onClick={() => onVerifyCompany(selectedCompany, true)} className="btn-action verify">
                    Approve Company
                  </button>
                ) : (
                  <button onClick={() => onVerifyCompany(selectedCompany, false)} className="btn-action unverify">
                    Disapprove Company
                  </button>
                )}
                <button
                  onClick={() => onToggleStatus(selectedCompany)}
                  className={`btn-action ${selectedCompany.isActive ? 'deactivate' : 'activate'}`}
                >
                  {selectedCompany.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ManageCompaniesPage;
