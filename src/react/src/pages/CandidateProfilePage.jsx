import { useEffect, useMemo, useRef, useState } from 'react';
import { getCandidateProfile, updateCandidateProfile, uploadCandidateProfilePicture } from '../services/candidateService';
import { Toast, useDialog } from '../components/Dialog';
import { toPublicFileUrl } from '../utils/media';
import { optimizeImageForUpload } from '../utils/imageUpload';
import '../../../app/candidate/candidate-profile/candidate-profile.css';

const EMPTY_PROFILE = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  location: '',
  education: '',
  experience: '',
  bio: '',
  skills: [],
  linkedinUrl: '',
  portfolioUrl: '',
  profilePicture: '',
  candidateId: null
};

function CandidateProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [originalProfile, setOriginalProfile] = useState(EMPTY_PROFILE);
  const photoInputRef = useRef(null);
  const { notify, toast, dismissToast } = useDialog();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getCandidateProfile();
        const fullName = data?.fullName || '';
        const nameParts = fullName.trim().split(' ').filter(Boolean);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ');

        const mapped = {
          firstName,
          lastName,
          email: data?.email || '',
          phone: data?.phoneNumber || '',
          location: data?.location || '',
          education: data?.education || '',
          experience: data?.experienceYears != null ? String(data.experienceYears) : '',
          bio: data?.bio || '',
          skills: data?.skills ? String(data.skills).split(',').map((s) => s.trim()).filter(Boolean) : [],
          linkedinUrl: data?.linkedinUrl || data?.linkedInUrl || '',
          portfolioUrl: data?.portfolioUrl || '',
          profilePicture: data?.profilePicture || '',
          candidateId: data?.candidateId || data?.id || null
        };

        setProfile(mapped);
        setOriginalProfile(mapped);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const avatarLetter = useMemo(
    () => (profile.firstName || profile.email || 'C').charAt(0).toUpperCase(),
    [profile.firstName, profile.email]
  );

  const profilePictureUrl = useMemo(
    () => toPublicFileUrl(profile.profilePicture),
    [profile.profilePicture]
  );

  useEffect(() => {
    setPhotoLoadError(false);
  }, [profilePictureUrl]);

  const updateField = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const updateSkills = (value) => {
    const skills = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    setProfile((prev) => ({ ...prev, skills }));
  };

  const syncCurrentUserStorage = (overrides = {}) => {
    const existing = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const nextUser = {
      ...existing,
      fullName: `${profile.firstName} ${profile.lastName}`.trim(),
      email: profile.email,
      profilePicture: profile.profilePicture,
      ...overrides
    };
    localStorage.setItem('currentUser', JSON.stringify(nextUser));
    window.dispatchEvent(new Event('user-profile-updated'));
  };

  const onPhotoSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!String(file.type || '').startsWith('image/')) {
      notify('Please select a valid image file.', 'error');
      return;
    }

    setUploadingPhoto(true);
    try {
      const optimizedFile = await optimizeImageForUpload(file, {
        maxDimension: 1200,
        maxFileSizeMB: 2
      });

      const response = await uploadCandidateProfilePicture(optimizedFile);
      const newProfilePicture = response?.candidate?.profilePicture || '';

      setProfile((prev) => ({ ...prev, profilePicture: newProfilePicture }));
      setOriginalProfile((prev) => ({ ...prev, profilePicture: newProfilePicture }));
      syncCurrentUserStorage({ profilePicture: newProfilePicture });
      notify('Profile picture updated successfully.');
    } catch (error) {
      notify(error?.response?.data?.error || 'Failed to upload profile picture.', 'error');
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await updateCandidateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        education: profile.education,
        experience: profile.experience,
        bio: profile.bio,
        skills: profile.skills.join(','),
        linkedinUrl: profile.linkedinUrl,
        portfolioUrl: profile.portfolioUrl
      });

      setOriginalProfile(profile);
      syncCurrentUserStorage();
      notify('Profile updated successfully.');
    } catch (error) {
      notify(error?.response?.data?.error || error?.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setProfile(originalProfile);
  };

  return (
    <div className="profile-container">
      <Toast toast={toast} onDismiss={dismissToast} />
      <div className="page-header">
        <h2>My Profile</h2>
        <p>Manage your personal information and career details</p>
      </div>

      {loading ? <div className="loading">Loading...</div> : null}

      {!loading ? (
        <form onSubmit={saveProfile} className="profile-form">
          <div className="profile-image-section">
            {profilePictureUrl && !photoLoadError ? (
              <img
                src={profilePictureUrl}
                alt="Profile"
                className="avatar-large avatar-image"
                onError={() => setPhotoLoadError(true)}
              />
            ) : (
              <div className="avatar-large">{avatarLetter}</div>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={onPhotoSelected}
            />
            <button
              type="button"
              className="btn-upload-image"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
            >
              {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>

          <div className="form-section">
            <h3>Personal Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input type="text" value={profile.firstName} onChange={(e) => updateField('firstName', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input type="text" value={profile.lastName} onChange={(e) => updateField('lastName', e.target.value)} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={profile.email} onChange={(e) => updateField('email', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input type="tel" value={profile.phone} onChange={(e) => updateField('phone', e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>Location *</label>
              <input type="text" value={profile.location} onChange={(e) => updateField('location', e.target.value)} required />
            </div>
          </div>

          <div className="form-section">
            <h3>Professional Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Education *</label>
                <input type="text" value={profile.education} onChange={(e) => updateField('education', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Experience *</label>
                <input type="text" value={profile.experience} onChange={(e) => updateField('experience', e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea value={profile.bio} onChange={(e) => updateField('bio', e.target.value)} rows="4"></textarea>
            </div>

            <div className="form-group">
              <label>Skills (comma separated)</label>
              <input type="text" value={profile.skills.join(', ')} onChange={(e) => updateSkills(e.target.value)} />
            </div>
          </div>

          <div className="form-section">
            <h3>Links</h3>
            <div className="form-group">
              <label>LinkedIn URL</label>
              <input type="url" value={profile.linkedinUrl} onChange={(e) => updateField('linkedinUrl', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Portfolio URL</label>
              <input type="url" value={profile.portfolioUrl} onChange={(e) => updateField('portfolioUrl', e.target.value)} />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn-cancel" onClick={cancelEdit}>Cancel</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export default CandidateProfilePage;
