import { useEffect, useMemo, useRef, useState } from 'react';
import { getCompanyProfile, updateCompanyProfile, uploadCompanyLogo } from '../services/companyService';
import { toPublicFileUrl } from '../utils/media';
import { optimizeImageForUpload } from '../utils/imageUpload';
import '../../../app/company/company-profile/company-profile.css';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Marketing',
  'Consulting',
  'Construction',
  'Other'
];

function CompanyProfilePage() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [values, setValues] = useState({
    companyName: '',
    email: '',
    phoneNumber: '',
    industry: '',
    location: '',
    website: '',
    description: ''
  });

  const [touched, setTouched] = useState({});
  const logoInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        const profile = await getCompanyProfile();
        setCompany(profile);
        setValues({
          companyName: profile?.companyName || '',
          email: profile?.email || '',
          phoneNumber: profile?.phone || '',
          industry: profile?.industry || '',
          location: profile?.location || '',
          website: profile?.website || '',
          description: profile?.description || ''
        });
      } catch (error) {
        setErrorMessage(error?.response?.data?.error || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const errors = useMemo(() => {
    const next = {};
    if (!values.companyName || values.companyName.trim().length < 3) {
      next.companyName = 'Minimum 3 characters required';
    }
    if (values.phoneNumber && !/^[0-9]{11}$/.test(values.phoneNumber)) {
      next.phoneNumber = 'Enter valid 11-digit phone number';
    }
    if (!values.industry) next.industry = 'Industry is required';
    if (!values.location) next.location = 'Location is required';
    if (values.website && !/^https?:\/\/.+/i.test(values.website)) {
      next.website = 'Enter valid URL starting with http:// or https://';
    }
    if (values.description && values.description.trim().length > 0 && values.description.trim().length < 20) {
      next.description = 'Description should be at least 20 characters';
    }
    return next;
  }, [values]);

  const getVerificationBadgeClass = () =>
    company?.isVerified ? 'badge-verified' : 'badge-unverified';

  const companyLogoUrl = useMemo(() => toPublicFileUrl(company?.logo), [company?.logo]);

  useEffect(() => {
    setLogoLoadError(false);
  }, [companyLogoUrl]);

  const syncCompanyStorage = (companyOverrides = {}) => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const updatedUser = {
      ...user,
      companyName: values.companyName,
      logo: company?.logo || null,
      ...companyOverrides
    };
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    const existingCompany = JSON.parse(localStorage.getItem('currentCompany') || '{}');
    localStorage.setItem('currentCompany', JSON.stringify({
      ...existingCompany,
      companyName: values.companyName,
      logo: company?.logo || null,
      ...companyOverrides
    }));
    window.dispatchEvent(new Event('user-profile-updated'));
  };

  const onLogoSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!String(file.type || '').startsWith('image/')) {
      setErrorMessage('Please select a valid image file.');
      return;
    }

    setUploadingLogo(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const optimizedFile = await optimizeImageForUpload(file, {
        maxDimension: 1200,
        maxFileSizeMB: 2
      });

      const response = await uploadCompanyLogo(optimizedFile);
      const updatedLogo = response?.company?.logo || response?.company?.Logo || '';
      setCompany((prev) => (prev ? { ...prev, logo: updatedLogo } : prev));
      syncCompanyStorage({ logo: updatedLogo });
      setSuccessMessage('Logo updated successfully.');
    } catch (error) {
      setErrorMessage(error?.response?.data?.error || 'Failed to upload logo.');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const toggleEditMode = () => {
    if (editMode) {
      setValues({
        companyName: company?.companyName || '',
        email: company?.email || '',
        phoneNumber: company?.phone || '',
        industry: company?.industry || '',
        location: company?.location || '',
        website: company?.website || '',
        description: company?.description || ''
      });
      setTouched({});
      setErrorMessage('');
    }
    setEditMode((prev) => !prev);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!editMode) return;

    setTouched({
      companyName: true,
      phoneNumber: true,
      industry: true,
      location: true,
      website: true,
      description: true
    });

    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const payload = {
        companyName: values.companyName,
        phone: values.phoneNumber,
        industry: values.industry,
        location: values.location,
        website: values.website,
        description: values.description
      };

      await updateCompanyProfile(payload);

      const updatedCompany = {
        ...company,
        companyName: values.companyName,
        email: values.email,
        phone: values.phoneNumber,
        industry: values.industry,
        location: values.location,
        website: values.website,
        description: values.description
      };

      setCompany(updatedCompany);
      syncCompanyStorage(updatedCompany);

      setEditMode(false);
      setSuccessMessage('Profile updated successfully.');
    } catch (error) {
      setErrorMessage(error?.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div>
          <h1>Company Profile</h1>
          <p>Manage your company information</p>
        </div>
        <div className="header-actions">
          {company?.isVerified ? <span className={getVerificationBadgeClass()}>✓ Verified</span> : null}
        </div>
      </div>

      {company ? (
        <div className="profile-content">
          <div className="company-header-card">
            {companyLogoUrl && !logoLoadError ? (
              <img
                src={companyLogoUrl}
                alt="Company logo"
                className="company-logo"
                onError={() => setLogoLoadError(true)}
              />
            ) : (
              <div className="company-logo">{(company.companyName || 'C').charAt(0)}</div>
            )}
            <div className="company-main-info">
              <h2>{company.companyName}</h2>
              <p className="company-tagline">{company.industry || 'Industry'} | {company.location || 'Location'}</p>
              <p className="company-member-since">
                Member since {company.createdAt ? new Date(company.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : '-'}
              </p>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onLogoSelected}
              />
              <button
                type="button"
                className="btn-edit"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? 'Uploading...' : 'Change Logo'}
              </button>
            </div>
          </div>

          {successMessage ? <div className="alert alert-success">✓ {successMessage}</div> : null}
          {errorMessage ? <div className="alert alert-error">✗ {errorMessage}</div> : null}

          <form onSubmit={onSubmit} className="profile-form">
            <div className="form-section">
              <div className="section-header">
                <h3>📋 Basic Information</h3>
                {!editMode ? (
                  <button type="button" className="btn-edit" onClick={toggleEditMode}>✏️ Edit Profile</button>
                ) : null}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="companyName">Company Name *</label>
                  <input
                    type="text"
                    id="companyName"
                    className={`form-control ${editMode && touched.companyName && errors.companyName ? 'invalid' : ''}`}
                    disabled={!editMode}
                    value={values.companyName}
                    onBlur={() => setTouched((prev) => ({ ...prev, companyName: true }))}
                    onChange={(e) => setValues((prev) => ({ ...prev, companyName: e.target.value }))}
                  />
                  {editMode && touched.companyName && errors.companyName ? <div className="error-message">{errors.companyName}</div> : null}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input type="email" id="email" className="form-control" disabled value={values.email} />
                  <small className="form-hint">Email cannot be changed for security reasons</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    className={`form-control ${editMode && touched.phoneNumber && errors.phoneNumber ? 'invalid' : ''}`}
                    disabled={!editMode}
                    placeholder="03001234567"
                    value={values.phoneNumber}
                    onBlur={() => setTouched((prev) => ({ ...prev, phoneNumber: true }))}
                    onChange={(e) => setValues((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                  {editMode && touched.phoneNumber && errors.phoneNumber ? <div className="error-message">{errors.phoneNumber}</div> : null}
                </div>

                <div className="form-group">
                  <label htmlFor="industry">Industry *</label>
                  <select
                    id="industry"
                    className={`form-control ${editMode && touched.industry && errors.industry ? 'invalid' : ''}`}
                    disabled={!editMode}
                    value={values.industry}
                    onBlur={() => setTouched((prev) => ({ ...prev, industry: true }))}
                    onChange={(e) => setValues((prev) => ({ ...prev, industry: e.target.value }))}
                  >
                    <option value="">Select Industry</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                  {editMode && touched.industry && errors.industry ? <div className="error-message">{errors.industry}</div> : null}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location">Location *</label>
                  <input
                    type="text"
                    id="location"
                    className={`form-control ${editMode && touched.location && errors.location ? 'invalid' : ''}`}
                    disabled={!editMode}
                    placeholder="e.g., Karachi, Pakistan"
                    value={values.location}
                    onBlur={() => setTouched((prev) => ({ ...prev, location: true }))}
                    onChange={(e) => setValues((prev) => ({ ...prev, location: e.target.value }))}
                  />
                  {editMode && touched.location && errors.location ? <div className="error-message">{errors.location}</div> : null}
                </div>

                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input
                    type="url"
                    id="website"
                    className={`form-control ${editMode && touched.website && errors.website ? 'invalid' : ''}`}
                    disabled={!editMode}
                    placeholder="https://www.example.com"
                    value={values.website}
                    onBlur={() => setTouched((prev) => ({ ...prev, website: true }))}
                    onChange={(e) => setValues((prev) => ({ ...prev, website: e.target.value }))}
                  />
                  {editMode && touched.website && errors.website ? <div className="error-message">{errors.website}</div> : null}
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-header">
                <h3>📝 Company Description</h3>
              </div>

              <div className="form-group">
                <label htmlFor="description">About Your Company</label>
                <textarea
                  id="description"
                  className={`form-control ${editMode && touched.description && errors.description ? 'invalid' : ''}`}
                  rows="6"
                  disabled={!editMode}
                  placeholder="Tell candidates about your company, culture, and what makes it a great place to work..."
                  value={values.description}
                  onBlur={() => setTouched((prev) => ({ ...prev, description: true }))}
                  onChange={(e) => setValues((prev) => ({ ...prev, description: e.target.value }))}
                ></textarea>
                {editMode && touched.description && errors.description ? <div className="error-message">{errors.description}</div> : null}
              </div>
            </div>

            <div className="stats-section">
              <div className="stat-item">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <div className="stat-label">Account Status</div>
                  <div className="stat-value">{company.isActive ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">✓</div>
                <div className="stat-info">
                  <div className="stat-label">Verification</div>
                  <div className="stat-value">{company.isVerified ? 'Verified' : 'Pending'}</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <div className="stat-label">Member Since</div>
                  <div className="stat-value">
                    {company.createdAt ? new Date(company.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '-'}
                  </div>
                </div>
              </div>
            </div>

            {editMode ? (
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={toggleEditMode} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving || Object.keys(errors).length > 0}>
                  {!saving ? '💾 Save Changes' : 'Saving...'}
                </button>
              </div>
            ) : null}
          </form>
        </div>
      ) : (
        <div className="empty-state">
          <h3>No company profile found</h3>
          <p>Please log in again or contact support.</p>
        </div>
      )}
    </div>
  );
}

export default CompanyProfilePage;
