import { useEffect, useRef, useState } from 'react';
import {
  deleteCandidateResume,
  getCandidateProfile,
  updateCandidateProfile,
  uploadCandidateResume
} from '../services/candidateService';
import { DialogModal, Toast, useDialog } from '../components/Dialog';
import '../../../app/candidate/manage-resume/manage-resume.css';

function ManageResumePage() {
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [candidateId, setCandidateId] = useState(null);
  const { notify, confirm, toast, modal, dismissToast, handleModalResult } = useDialog();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const profile = await getCandidateProfile();
        const id = profile?.candidateId || profile?.id || null;
        setCandidateId(id);

        if (profile?.resumeLink) {
          const fileName = String(profile.resumeLink).split(/[\\/]/).pop() || 'resume';
          setResumes([
            {
              id: 1,
              fileName,
              fileSize: 0,
              uploadedAt: profile.updatedAt || profile.createdAt || new Date().toISOString(),
              fileUrl: profile.resumeLink,
              isActive: true
            }
          ]);
        } else {
          setResumes([]);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onDragOver = (event) => {
    event.preventDefault();
  };

  const onDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const onFileSelected = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    event.target.value = '';
  };

  const handleUpload = async (file) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      notify('Only PDF, DOC, and DOCX files are supported.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify('Maximum file size is 5MB.', 'error');
      return;
    }

    setUploading(true);
    try {
      const uploadResult = await uploadCandidateResume(file);
      const profile = await getCandidateProfile();
      const fileUrl = profile?.resumeLink || file.name;
      const fileName = String(fileUrl).split(/[\\/]/).pop() || file.name;
      setResumes([
        {
          id: 1,
          fileName,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          fileUrl,
          isActive: true
        }
      ]);

      const extractedFields = uploadResult?.extractedFields || [];
      const autoFilledNotice = uploadResult?.autoFilledNotice || '';
      
      if (extractedFields.length > 0) {
        const fieldsList = extractedFields.slice(0, 4).join(', ');
        const remaining = extractedFields.length > 4 ? ` +${extractedFields.length - 4} more` : '';
        notify(
          `✓ Resume uploaded!\n📋 Auto-filled: ${fieldsList}${remaining}`,
          'success',
          5000
        );
        console.log('Profile fields auto-filled from resume:', extractedFields);
        console.log('Updated profile:', { resumeLink: profile?.resumeLink, autoFilled: extractedFields });
      } else {
        notify(
          '✓ Resume uploaded.\n(No profile fields could be auto-filled from this resume)',
          'success',
          4000
        );
      }
    } catch (error) {
      notify(error?.response?.data?.error || error?.response?.data?.message || 'Failed to upload resume.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const downloadResume = (fileUrl) => {
    if (!fileUrl) {
      return;
    }

    const normalized = String(fileUrl).replace(/\\/g, '/');
    if (normalized.startsWith('http')) {
      window.open(normalized, '_blank', 'noopener,noreferrer');
      return;
    }

    const absolute = `http://localhost:5001/${normalized.replace(/^\/+/, '')}`;
    window.open(absolute, '_blank', 'noopener,noreferrer');
  };

  const setActive = (resumeId) => {
    setResumes((prev) => prev.map((resume) => ({ ...resume, isActive: resume.id === resumeId })));
  };

  const deleteResume = async () => {
    if (!resumes.length) return;

    const ok = await confirm('Delete active resume?', 'This action cannot be undone.');
    if (!ok) return;

    try {
      const fallbackUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      await deleteCandidateResume(candidateId || fallbackUser.id || 0);
      await updateCandidateProfile({ resumeLink: null });
      setResumes([]);
      notify('Resume deleted successfully.');
    } catch (error) {
      notify(error?.response?.data?.error || error?.response?.data?.message || 'Failed to delete resume.', 'error');
    }
  };

  return (
    <div className="resume-container">
      <Toast toast={toast} onDismiss={dismissToast} />
      <DialogModal modal={modal} onResult={handleModalResult} />
      <div className="page-header">
        <h2>Manage Resumes</h2>
        <p>Upload and manage your resume files</p>
      </div>

      <div className="upload-section">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={onFileSelected}
          style={{ display: 'none' }}
        />
        <div className="upload-area" onClick={openFilePicker} onDragOver={onDragOver} onDrop={onDrop}>
          <div className="upload-icon">📄</div>
          <h3>Upload Resume</h3>
          <p>Drag and drop your resume here or click to browse</p>
          <p className="file-info">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
        </div>
        {uploading ? (
          <div className="upload-progress">
            <div className="progress-bar"><div className="progress-fill"></div></div>
            <p>Uploading...</p>
          </div>
        ) : null}
      </div>

      <div className="resumes-section">
        <h3>Your Resumes</h3>
        {loading ? <div className="loading">Loading resumes...</div> : null}

        {!loading && resumes.length === 0 ? (
          <div className="empty-state">
            <p>No resumes uploaded yet</p>
          </div>
        ) : null}

        {!loading && resumes.length > 0 ? (
          <div className="resumes-list">
            {resumes.map((resume) => (
              <div key={resume.id} className="resume-card">
                <div className="resume-icon">📄</div>
                <div className="resume-info">
                  <h4>{resume.fileName}</h4>
                  <p className="resume-meta">
                    <span>{formatFileSize(resume.fileSize)}</span> •
                    <span> Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}</span>
                  </p>
                  {resume.isActive ? <span className="active-badge">✓ Active Resume</span> : null}
                </div>
                <div className="resume-actions">
                  <button onClick={() => downloadResume(resume.fileUrl)} className="btn-action">Download</button>
                  {!resume.isActive ? (
                    <button onClick={() => setActive(resume.id)} className="btn-action">Set as Active</button>
                  ) : null}
                  <button onClick={deleteResume} className="btn-delete">Delete</button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ManageResumePage;
