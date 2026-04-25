import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAllActiveJobs } from '../services/candidateService';
import { toPublicFileUrl } from '../utils/media';
import '../../../app/candidate/browse-jobs/browse-jobs.css';

function BrowseJobsPage() {
  const location = useLocation();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');

  useEffect(() => {
    const initialSearch = location.state?.initialSearch;
    if (typeof initialSearch === 'string' && initialSearch.trim()) {
      setSearchQuery(initialSearch.trim());
    }
  }, [location.state]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getAllActiveJobs();
        setJobs(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const locations = useMemo(() => [...new Set(jobs.map((job) => job.location).filter(Boolean))], [jobs]);
  const jobTypes = useMemo(() => [...new Set(jobs.map((job) => job.employmentType).filter(Boolean))], [jobs]);
  const companies = useMemo(() => [...new Set(jobs.map((job) => job.companyName).filter(Boolean))], [jobs]);

  const filteredJobs = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return jobs.filter((job) => {
      const deadlineDate = job.deadline ? new Date(job.deadline) : null;
      if (deadlineDate) {
        deadlineDate.setHours(0, 0, 0, 0);
      }
      const isNotExpired = !deadlineDate || deadlineDate >= today;
      const matchesSearch =
        !term ||
        (job.title || '').toLowerCase().includes(term) ||
        (job.description || '').toLowerCase().includes(term);
      const matchesLocation = !selectedLocation || job.location === selectedLocation;
      const matchesType = !selectedJobType || job.employmentType === selectedJobType;
      const matchesCompany = !selectedCompany || job.companyName === selectedCompany;
      return isNotExpired && matchesSearch && matchesLocation && matchesType && matchesCompany;
    });
  }, [jobs, searchQuery, selectedLocation, selectedJobType, selectedCompany]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() || selectedLocation || selectedJobType || selectedCompany
  );

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedJobType('');
    setSelectedCompany('');
  };

  const getJobTypeClass = (employmentType) => {
    const text = String(employmentType || '').toLowerCase();
    if (text.includes('full')) return 'type-fulltime';
    if (text.includes('part')) return 'type-parttime';
    if (text.includes('contract')) return 'type-contract';
    if (text.includes('intern')) return 'type-internship';
    if (text.includes('remote')) return 'type-remote';
    return 'type-fulltime';
  };

  return (
    <div className="browse-jobs-container">
      <div className="page-header">
        <h2>Browse Jobs</h2>
        <p>Find your dream job from {jobs.length} available positions</p>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search by job title or keywords..."
            className="search-input"
          />
        </div>

        <div className="filters-row">
          <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="filter-select">
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>

          <select value={selectedJobType} onChange={(e) => setSelectedJobType(e.target.value)} className="filter-select">
            <option value="">All Job Types</option>
            {jobTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="filter-select">
            <option value="">All Companies</option>
            {companies.map((company) => (
              <option key={company} value={company}>{company}</option>
            ))}
          </select>

          <button
            onClick={clearFilters}
            className={`btn-clear ${hasActiveFilters ? 'is-active' : ''}`}
            disabled={!hasActiveFilters}
          >
            Clear Filters
          </button>
        </div>

        <div className="results-info">Showing {filteredJobs.length} of {jobs.length} jobs</div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading jobs...</p>
        </div>
      ) : null}

      {!loading ? (
        <div className="jobs-grid">
          {filteredJobs.map((job) => (
            <div key={job.jobId} className="job-card">
              {(() => {
                const companyLogoUrl = toPublicFileUrl(job.logo);
                return (
              <div className="job-header">
                {companyLogoUrl ? (
                  <img src={companyLogoUrl} alt={job.companyName || 'Company'} className="company-logo" />
                ) : (
                  <div className="company-logo">{(job.companyName || 'C').charAt(0)}</div>
                )}
                <div className="job-title-section">
                  <h3>{job.title}</h3>
                  <p className="company-name">{job.companyName}</p>
                </div>
              </div>
                );
              })()}

              <div className="job-details">
                <span className="detail-item">
                  <span className="icon">📍</span>
                  {job.location}
                </span>
                <span className="detail-item">
                  <span className="icon">💼</span>
                  <span className={`job-type-badge ${getJobTypeClass(job.employmentType)}`}>
                    {job.employmentType}
                  </span>
                </span>
                <span className="detail-item">
                  <span className="icon">💰</span>
                  {job.salaryRange || 'Not specified'}
                </span>
              </div>

              <p className="job-description">
                {(job.description || '').substring(0, 150)}
                {(job.description || '').length > 150 ? '...' : ''}
              </p>

              <div className="job-skills">
                {job.requirements ? (
                  <>
                    {job.requirements
                      .split(',')
                      .slice(0, 3)
                      .map((skill) => (
                        <span key={skill.trim()} className="skill-tag">{skill.trim()}</span>
                      ))}
                    {job.requirements.split(',').length > 3 ? (
                      <span className="skill-tag more">+{job.requirements.split(',').length - 3} more</span>
                    ) : null}
                  </>
                ) : (
                  <span className="no-requirements">No requirements listed</span>
                )}
              </div>

              <div className="job-footer">
                <span className="post-date">
                  Posted {job.postedAt ? new Date(job.postedAt).toLocaleDateString() : '-'}
                </span>
                <Link to={`/candidate/job-details/${job.jobId}`} className="btn-view-details">
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && filteredJobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No Jobs Found</h3>
          <p>Try adjusting your filters or search terms</p>
          <button onClick={clearFilters} className="btn-primary">Clear All Filters</button>
        </div>
      ) : null}
    </div>
  );
}

export default BrowseJobsPage;
