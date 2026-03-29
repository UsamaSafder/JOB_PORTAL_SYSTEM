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
    <div className="post-job-container">
      <div className="header">
        <h1>{isEditMode ? 'Edit Job' : 'Post New Job'}</h1>
        <p className="subtitle">
          {isEditMode ? 'Update the job details' : 'Fill in the details to create a new job posting'}
        </p>
      </div>

      {successMessage ? <div className="alert alert-success">✓ {successMessage}</div> : null}
      {errorMessage ? <div className="alert alert-error">✕ {errorMessage}</div> : null}

      <form onSubmit={onSubmit} className="job-form">
        <div className="form-group">
          <label htmlFor="title">Job Title <span className="required">*</span></label>
          <input
            type="text"
            id="title"
            className={`form-control ${submitted && errors.title ? 'invalid' : ''}`}
            placeholder="e.g., Senior Software Engineer"
            value={values.title}
            onChange={(e) => setField('title', e.target.value)}
          />
          {submitted && errors.title ? <div className="error-message">{errors.title}</div> : null}
        </div>

        <div className="form-group">
          <label htmlFor="location">Location <span className="required">*</span></label>
          <input
            type="text"
            id="location"
            className={`form-control ${submitted && errors.location ? 'invalid' : ''}`}
            placeholder="e.g., Lahore, Pakistan"
            value={values.location}
            onChange={(e) => setField('location', e.target.value)}
          />
          {submitted && errors.location ? <div className="error-message">{errors.location}</div> : null}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="employmentType">Employment Type <span className="required">*</span></label>
            <select
              id="employmentType"
              className={`form-control ${submitted && errors.employmentType ? 'invalid' : ''}`}
              value={values.employmentType}
              onChange={(e) => setField('employmentType', e.target.value)}
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {submitted && errors.employmentType ? <div className="error-message">{errors.employmentType}</div> : null}
          </div>

          <div className="form-group">
            <label htmlFor="salaryRange">Salary Range <span className="required">*</span></label>
            <input
              type="text"
              id="salaryRange"
              className={`form-control ${submitted && errors.salaryRange ? 'invalid' : ''}`}
              placeholder="e.g., 80k-100k PKR"
              value={values.salaryRange}
              onChange={(e) => setField('salaryRange', e.target.value)}
            />
            {submitted && errors.salaryRange ? <div className="error-message">{errors.salaryRange}</div> : null}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="deadline">Application Deadline <span className="required">*</span></label>
          <input
            type="date"
            id="deadline"
            className={`form-control ${submitted && errors.deadline ? 'invalid' : ''}`}
            value={values.deadline}
            onChange={(e) => setField('deadline', e.target.value)}
          />
          {submitted && errors.deadline ? <div className="error-message">{errors.deadline}</div> : null}
        </div>

        <div className="form-group">
          <label htmlFor="description">Job Description <span className="required">*</span></label>
          <textarea
            id="description"
            className={`form-control ${submitted && errors.description ? 'invalid' : ''}`}
            rows="6"
            placeholder="Describe the job responsibilities, work environment, and what makes this position unique..."
            value={values.description}
            onChange={(e) => setField('description', e.target.value)}
          ></textarea>
          {submitted && errors.description ? <div className="error-message">{errors.description}</div> : null}
        </div>

        <div className="form-group">
          <label htmlFor="requirements">Requirements <span className="required">*</span></label>
          <textarea
            id="requirements"
            className={`form-control ${submitted && errors.requirements ? 'invalid' : ''}`}
            rows="6"
            placeholder="List the required skills, qualifications, and experience..."
            value={values.requirements}
            onChange={(e) => setField('requirements', e.target.value)}
          ></textarea>
          {submitted && errors.requirements ? <div className="error-message">{errors.requirements}</div> : null}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={loading}>
            Reset
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {!loading ? (isEditMode ? 'Update Job' : 'Post Job') : (isEditMode ? 'Updating...' : 'Posting...')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PostJobPage;
