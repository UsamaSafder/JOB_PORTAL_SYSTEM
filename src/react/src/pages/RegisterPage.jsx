import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/authService';
import '../../../app/register/register.css';

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateName(value) {
  return /^[a-zA-Z\s\-']*$/.test(value);
}

function RegisterPage() {
  const navigate = useNavigate();
  const [selectedUserType, setSelectedUserType] = useState('candidate');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [values, setValues] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    skills: '',
    experienceYears: 0,
    companyName: '',
    industry: '',
    website: '',
    location: '',
    description: '',
    acceptTerms: false
  });

  const [touched, setTouched] = useState({});

  const errors = useMemo(() => {
    const nextErrors = {};

    if (selectedUserType === 'candidate') {
      if (!values.fullName) {
        nextErrors.fullName = 'Full name is required';
      } else if (values.fullName.length < 3) {
        nextErrors.fullName = 'Name must be at least 3 characters';
      } else if (!validateName(values.fullName)) {
        nextErrors.fullName = 'Name can only contain letters, spaces, hyphens, and apostrophes';
      }

      if (!values.skills) {
        nextErrors.skills = 'Skills are required';
      }
    }

    if (selectedUserType === 'company') {
      if (!values.companyName) {
        nextErrors.companyName = 'Company name is required';
      } else if (values.companyName.length < 3) {
        nextErrors.companyName = 'Company name must be at least 3 characters';
      } else if (!validateName(values.companyName)) {
        nextErrors.companyName = 'Company name can only contain letters, spaces, hyphens, and apostrophes';
      }

      if (!values.industry) {
        nextErrors.industry = 'Industry is required';
      }
    }

    if (!values.email) {
      nextErrors.email = 'Email is required';
    } else if (!validateEmail(values.email)) {
      nextErrors.email = 'Please enter a valid email';
    }

    if (!values.phoneNumber) {
      nextErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{11}$/.test(values.phoneNumber)) {
      nextErrors.phoneNumber = 'Enter 11 digit phone number';
    }

    if (!values.password) {
      nextErrors.password = 'Password is required';
    } else if (values.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    if (!values.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password';
    } else if (values.password !== values.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    if (!values.acceptTerms) {
      nextErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    return nextErrors;
  }, [selectedUserType, values]);

  const isValid = Object.keys(errors).length === 0;

  const markAllTouched = () => {
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      phoneNumber: true,
      skills: true,
      experienceYears: true,
      companyName: true,
      industry: true,
      website: true,
      location: true,
      description: true,
      acceptTerms: true
    });
  };

  const setField = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => {
    const payload = {
      email: values.email,
      password: values.password,
      role: selectedUserType
    };

    if (selectedUserType === 'candidate') {
      const parts = (values.fullName || '').trim().split(/\s+/);
      const firstName = parts.shift() || '';
      const lastName = parts.join(' ') || '';

      payload.firstName = firstName;
      payload.lastName = lastName;
      payload.phone = values.phoneNumber;
      payload.skills = values.skills;
      payload.experienceYears = values.experienceYears || 0;
    }

    if (selectedUserType === 'company') {
      payload.companyName = values.companyName;
      payload.phone = values.phoneNumber;
      payload.industry = values.industry;

      if (values.website) {
        payload.website = values.website;
      }
      if (values.location) {
        payload.location = values.location;
      }
      if (values.description) {
        payload.description = values.description;
      }
    }

    return payload;
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!isValid) {
      markAllTouched();
      const fieldErrors = Object.entries(errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join('; ');
      setErrorMessage(fieldErrors ? `Form errors - ${fieldErrors}` : 'Please fill all required fields correctly.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await register(buildPayload());
      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      const backendError = error?.response?.data;

      if (backendError && typeof backendError === 'object') {
        if (Array.isArray(backendError.errors)) {
          setErrorMessage(backendError.errors.map((e) => e.msg).join(', '));
        } else if (backendError.error) {
          setErrorMessage(backendError.error);
        } else if (backendError.message) {
          setErrorMessage(backendError.message);
        } else {
          setErrorMessage(JSON.stringify(backendError));
        }
      } else if (error?.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-brand">
        <div className="brand-content">
          <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>🚀 JobPortal</h1>
          <p className="brand-tagline">Join Our Community Today</p>
          <div className="brand-features">
            <div className="brand-feature">
              <span className="check-icon">✓</span>
              <span>Free Account Creation</span>
            </div>
            <div className="brand-feature">
              <span className="check-icon">✓</span>
              <span>Access Thousands of Jobs</span>
            </div>
            <div className="brand-feature">
              <span className="check-icon">✓</span>
              <span>Connect with Top Companies</span>
            </div>
            <div className="brand-feature">
              <span className="check-icon">✓</span>
              <span>Track Your Applications</span>
            </div>
          </div>
        </div>
      </div>

      <div className="register-container">
        <div className="register-box">
          <div className="register-header">
            <h2>Create Your Account</h2>
            <p>Start your journey to find the perfect job</p>
          </div>

          <div className="user-type-selector">
            <button
              className={`user-type-btn ${selectedUserType === 'candidate' ? 'active' : ''}`}
              type="button"
              onClick={() => {
                setSelectedUserType('candidate');
                setErrorMessage('');
              }}
            >
              <span className="icon">👤</span>
              <span>Job Seeker</span>
            </button>
            <button
              className={`user-type-btn ${selectedUserType === 'company' ? 'active' : ''}`}
              type="button"
              onClick={() => {
                setSelectedUserType('company');
                setErrorMessage('');
              }}
            >
              <span className="icon">🏢</span>
              <span>Employer</span>
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <div className="form-row">
              {selectedUserType === 'candidate' ? (
                <div className="form-group">
                  <label htmlFor="fullName">Full Name *</label>
                  <div className="input-wrapper">
                                        <input
                      type="text"
                      id="fullName"
                      value={values.fullName}
                      onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
                      onChange={(e) => setField('fullName', e.target.value)}
                      placeholder="Enter your full name"
                      className={touched.fullName && errors.fullName ? 'error' : ''}
                    />
                  </div>
                  {touched.fullName && errors.fullName ? <div className="error-message"><span>{errors.fullName}</span></div> : null}
                </div>
              ) : null}

              {selectedUserType === 'company' ? (
                <div className="form-group">
                  <label htmlFor="companyName">Company Name *</label>
                  <div className="input-wrapper">
                                        <input
                      type="text"
                      id="companyName"
                      value={values.companyName}
                      onBlur={() => setTouched((prev) => ({ ...prev, companyName: true }))}
                      onChange={(e) => setField('companyName', e.target.value)}
                      placeholder="Enter company name"
                      className={touched.companyName && errors.companyName ? 'error' : ''}
                    />
                  </div>
                  {touched.companyName && errors.companyName ? <div className="error-message"><span>{errors.companyName}</span></div> : null}
                </div>
              ) : null}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <div className="input-wrapper">
                                    <input
                    type="email"
                    id="email"
                    value={values.email}
                    onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                    onChange={(e) => setField('email', e.target.value)}
                    placeholder="your.email@example.com"
                    className={touched.email && errors.email ? 'error' : ''}
                  />
                </div>
                {touched.email && errors.email ? <div className="error-message"><span>{errors.email}</span></div> : null}
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number *</label>
                <div className="input-wrapper">
                                    <input
                    type="tel"
                    id="phoneNumber"
                    value={values.phoneNumber}
                    onBlur={() => setTouched((prev) => ({ ...prev, phoneNumber: true }))}
                    onChange={(e) => setField('phoneNumber', e.target.value)}
                    placeholder="03001234567"
                    className={touched.phoneNumber && errors.phoneNumber ? 'error' : ''}
                  />
                </div>
                {touched.phoneNumber && errors.phoneNumber ? <div className="error-message"><span>{errors.phoneNumber}</span></div> : null}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <div className="input-wrapper">
                                    <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={values.password}
                    onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                    onChange={(e) => setField('password', e.target.value)}
                    placeholder="Create a strong password"
                    className={touched.password && errors.password ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {touched.password && errors.password ? <div className="error-message"><span>{errors.password}</span></div> : null}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <div className="input-wrapper">
                                    <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={values.confirmPassword}
                    onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                    onChange={(e) => setField('confirmPassword', e.target.value)}
                    placeholder="Re-enter your password"
                    className={touched.confirmPassword && errors.confirmPassword ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword ? <div className="error-message"><span>{errors.confirmPassword}</span></div> : null}
              </div>
            </div>

            {selectedUserType === 'candidate' ? (
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="skills">Skills *</label>
                    <div className="input-wrapper">
                                            <input
                        type="text"
                        id="skills"
                        value={values.skills}
                        onBlur={() => setTouched((prev) => ({ ...prev, skills: true }))}
                        onChange={(e) => setField('skills', e.target.value)}
                        placeholder="e.g., JavaScript, React, Node.js"
                        className={touched.skills && errors.skills ? 'error' : ''}
                      />
                    </div>
                    {touched.skills && errors.skills ? <div className="error-message"><span>{errors.skills}</span></div> : null}
                  </div>

                  <div className="form-group">
                    <label htmlFor="experienceYears">Years of Experience</label>
                    <div className="input-wrapper">
                                            <input
                        type="number"
                        id="experienceYears"
                        value={values.experienceYears}
                        onChange={(e) => setField('experienceYears', Number(e.target.value || 0))}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedUserType === 'company' ? (
              <div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="industry">Industry *</label>
                    <div className="input-wrapper">
                                            <select
                        id="industry"
                        value={values.industry}
                        onBlur={() => setTouched((prev) => ({ ...prev, industry: true }))}
                        onChange={(e) => setField('industry', e.target.value)}
                        className={touched.industry && errors.industry ? 'error' : ''}
                      >
                        <option value="">Select Industry</option>
                        <option value="Software">Software</option>
                        <option value="Design">Design</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {touched.industry && errors.industry ? <div className="error-message"><span>{errors.industry}</span></div> : null}
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <div className="input-wrapper">
                                            <input
                        type="text"
                        id="location"
                        value={values.location}
                        onChange={(e) => setField('location', e.target.value)}
                        placeholder="e.g., Karachi, Lahore"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="website">Company Website</label>
                  <div className="input-wrapper">
                                        <input
                      type="url"
                      id="website"
                      value={values.website}
                      onChange={(e) => setField('website', e.target.value)}
                      placeholder="https://www.yourcompany.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Company Description</label>
                  <div className="input-wrapper">
                    <textarea
                      id="description"
                      value={values.description}
                      onChange={(e) => setField('description', e.target.value)}
                      placeholder="Tell us about your company..."
                      rows="3"
                    ></textarea>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={values.acceptTerms}
                  onBlur={() => setTouched((prev) => ({ ...prev, acceptTerms: true }))}
                  onChange={(e) => setField('acceptTerms', e.target.checked)}
                />
                <span>
                  I agree to the <a href="#">Terms and Conditions</a> and <a href="#">Privacy Policy</a>
                </span>
              </label>
              {touched.acceptTerms && errors.acceptTerms ? <div className="error-message"><span>{errors.acceptTerms}</span></div> : null}
            </div>

            {errorMessage ? <div className="alert alert-error">{errorMessage}</div> : null}
            {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {!isLoading ? (
                <span>Create Account</span>
              ) : (
                <span className="loading-spinner">
                  <span className="spinner"></span> Creating account...
                </span>
              )}
            </button>
          </form>

          <div className="login-link">
            <p>
              Already have an account?
              {' '}
              <a onClick={() => navigate('/login')}>Sign In</a>
            </p>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <button className="btn-back" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;

