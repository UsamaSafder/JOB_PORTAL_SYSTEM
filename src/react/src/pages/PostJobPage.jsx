import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createJob, updateJob } from '../services/companyService';
import { getJobById } from '../services/jobsService';
import '../../../app/company/post-job/post-job.css';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Internship', 'Contract'];

function PostJobPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingJobId = searchParams.get('jobId');
  const isEditMode = !!editingJobId;

  const [values, setValues] = useState({
    title: '',
    location: '',
    employmentType: 'Full-time',
    salaryRange: '',
    deadline: '',
    description: '',
    requirements: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const errors = useMemo(() => {
    const next = {};
    if (!values.title) next.title = 'Job title is required';
    else if (values.title.trim().length < 3) next.title = 'Job title must be at least 3 characters';

    if (!values.location) next.location = 'Location is required';
    if (!values.employmentType) next.employmentType = 'Employment type is required';
    if (!values.salaryRange) next.salaryRange = 'Salary range is required';
    if (!values.deadline) next.deadline = 'Deadline is required';

    if (!values.description) next.description = 'Job description is required';
    else if (values.description.trim().length < 20) {
      next.description = 'Description must be at least 20 characters';
    }

    if (!values.requirements) next.requirements = 'Requirements are required';
    else if (values.requirements.trim().length < 10) {
      next.requirements = 'Requirements must be at least 10 characters';
    }
    return next;
  }, [values]);

  useEffect(() => {
    const loadJob = async () => {
      if (!isEditMode) return;
      setLoading(true);
      setErrorMessage('');
      try {
        const data = await getJobById(editingJobId);
        setValues({
          title: data?.title || '',
          location: data?.location || '',
          employmentType: data?.employmentType || 'Full-time',
          salaryRange: data?.salaryRange || '',
          deadline: data?.deadline ? new Date(data.deadline).toISOString().slice(0, 10) : '',
          description: data?.description || '',
          requirements: data?.requirements || ''
        });
      } catch (error) {
        setErrorMessage(error?.response?.data?.error || 'Failed to load job details.');
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [editingJobId, isEditMode]);

  const setField = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setValues({
      title: '',
      location: '',
      employmentType: 'Full-time',
      salaryRange: '',
      deadline: '',
      description: '',
      requirements: ''
    });
    setSubmitted(false);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setSuccessMessage('');
    setErrorMessage('');

    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      if (isEditMode) {
        await updateJob(editingJobId, values);
        setSuccessMessage('Job updated successfully!');
      } else {
        await createJob(values);
        setSuccessMessage('Job posted successfully!');
        resetForm();
      }

      setTimeout(() => {
        navigate('/company/manage-jobs');
      }, 1200);
    } catch (error) {
      if (Array.isArray(error?.response?.data?.errors)) {
        setErrorMessage(error.response.data.errors.map((e) => e.msg).join(', '));
      } else {
        setErrorMessage(error?.response?.data?.error || 'Failed to submit job.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-job-modern-outer">
      <div className="post-job-modern-card">
        <div className="post-job-modern-accent"></div>
        <div className="post-job-modern-header">
          <span className="post-job-modern-icon">💼</span>
          <div>
            <h1 className="post-job-modern-title">{isEditMode ? 'Edit Job' : 'Post New Job'}</h1>
            <p className="post-job-modern-subtitle">{isEditMode ? 'Update the job details' : 'Fill in the details to create a new job posting'}</p>
          </div>
        </div>
        {successMessage ? <div className="alert alert-success">✓ {successMessage}</div> : null}
        {errorMessage ? <div className="alert alert-error">✕ {errorMessage}</div> : null}
        <form onSubmit={onSubmit} className="post-job-modern-form">
          <div className="post-job-modern-row">
            <div className="post-job-modern-field">
              <input type="text" id="title" className={`post-job-modern-input${values.title ? ' filled' : ''} ${submitted && errors.title ? 'invalid' : ''}`} value={values.title} onChange={e => setField('title', e.target.value)} required />
              <label htmlFor="title" className="post-job-modern-label">Job Title <span>*</span></label>
              {submitted && errors.title ? <div className="error-message">{errors.title}</div> : null}
            </div>
            <div className="post-job-modern-field">
              <input type="text" id="location" className={`post-job-modern-input${values.location ? ' filled' : ''} ${submitted && errors.location ? 'invalid' : ''}`} value={values.location} onChange={e => setField('location', e.target.value)} required />
              <label htmlFor="location" className="post-job-modern-label">Location <span>*</span></label>
              {submitted && errors.location ? <div className="error-message">{errors.location}</div> : null}
            </div>
          </div>
          <div className="post-job-modern-row">
            <div className="post-job-modern-field">
              <label htmlFor="employmentType" className="post-job-modern-label">Employment Type <span>*</span></label>
              <select id="employmentType" className={`post-job-modern-input${values.employmentType ? ' filled' : ''} ${submitted && errors.employmentType ? 'invalid' : ''}`} value={values.employmentType} onChange={e => setField('employmentType', e.target.value)} required>
                {EMPLOYMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              {submitted && errors.employmentType ? <div className="error-message">{errors.employmentType}</div> : null}
            </div>
            <div className="post-job-modern-field">
              <input type="text" id="salaryRange" className={`post-job-modern-input${values.salaryRange ? ' filled' : ''} ${submitted && errors.salaryRange ? 'invalid' : ''}`} value={values.salaryRange} onChange={e => setField('salaryRange', e.target.value)} required />
              <label htmlFor="salaryRange" className="post-job-modern-label">Salary Range <span>*</span></label>
              {submitted && errors.salaryRange ? <div className="error-message">{errors.salaryRange}</div> : null}
            </div>
            <div className="post-job-modern-field">
              <label htmlFor="deadline" className="post-job-modern-label">Application Deadline <span>*</span></label>
              <input type="date" id="deadline" className={`post-job-modern-input${values.deadline ? ' filled' : ''} ${submitted && errors.deadline ? 'invalid' : ''}`} value={values.deadline} onChange={e => setField('deadline', e.target.value)} required />
              {submitted && errors.deadline ? <div className="error-message">{errors.deadline}</div> : null}
            </div>
          </div>
          <div className="post-job-modern-row">
            <div className="post-job-modern-field post-job-modern-field-wide">
              <textarea id="description" className={`post-job-modern-input${values.description ? ' filled' : ''} ${submitted && errors.description ? 'invalid' : ''}`} rows={4} value={values.description} onChange={e => setField('description', e.target.value)} required />
              <label htmlFor="description" className="post-job-modern-label">Job Description <span>*</span></label>
              {submitted && errors.description ? <div className="error-message">{errors.description}</div> : null}
            </div>
          </div>
          <div className="post-job-modern-row">
            <div className="post-job-modern-field post-job-modern-field-wide">
              <textarea id="requirements" className={`post-job-modern-input${values.requirements ? ' filled' : ''} ${submitted && errors.requirements ? 'invalid' : ''}`} rows={3} value={values.requirements} onChange={e => setField('requirements', e.target.value)} required />
              <label htmlFor="requirements" className="post-job-modern-label">Requirements <span>*</span></label>
              {submitted && errors.requirements ? <div className="error-message">{errors.requirements}</div> : null}
            </div>
          </div>
          <div className="post-job-modern-actions">
            <button type="button" className="post-job-modern-btn post-job-modern-btn-secondary" onClick={resetForm} disabled={loading}>Reset</button>
            <button type="submit" className="post-job-modern-btn post-job-modern-btn-primary" disabled={loading}>
              {!loading ? (isEditMode ? 'Update Job' : 'Post Job') : (isEditMode ? 'Updating...' : 'Posting...')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostJobPage;
