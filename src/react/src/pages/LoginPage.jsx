import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import '../../../app/login/login.css';

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function LoginPage() {
  const navigate = useNavigate();
  const [selectedUserType, setSelectedUserType] = useState('candidate');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });

  const errors = useMemo(() => {
    const nextErrors = { email: '', password: '' };

    if (!values.email) {
      nextErrors.email = 'Email is required';
    } else if (!validateEmail(values.email)) {
      nextErrors.email = 'Please enter a valid email';
    }

    if (!values.password) {
      nextErrors.password = 'Password is required';
    } else if (values.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    return nextErrors;
  }, [values]);

  const isValid = !errors.email && !errors.password;

  const markAllTouched = () => {
    setTouched({ email: true, password: true });
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!isValid) {
      markAllTouched();
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await login({
        email: values.email,
        password: values.password,
        role: selectedUserType
      });

      const role = response?.user?.role;

      if (role === 'company') {
        navigate('/company/dashboard');
      } else if (role === 'candidate') {
        navigate('/candidate/dashboard');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      const apiError = error?.response?.data?.error;
      if (apiError === 'Selected account type does not match these credentials') {
        setErrorMessage('Selected account type does not match these credentials. Please choose the correct role and try again.');
      } else {
        setErrorMessage(apiError || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-brand">
        <div className="brand-content">
          <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>🚀 JobPortal</h1>
          <p className="brand-tagline">Your Gateway to Career Success</p>
          <div className="brand-features">
            <div className="brand-feature">
              <span className="check-icon">✓</span>
              <span>Connect with Top Companies</span>
            </div>
            <div className="brand-feature">
              <span className="check-icon">✓</span>
              <span>Track Your Applications</span>
            </div>
            <div className="brand-feature">
              <span className="check-icon">✓</span>
              <span>Get Hired Faster</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h2>Welcome Back!</h2>
            <p>Sign in to continue to your account</p>
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
              <span>Candidate</span>
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
              <span>Company</span>
            </button>
            <button
              className={`user-type-btn ${selectedUserType === 'admin' ? 'active' : ''}`}
              type="button"
              onClick={() => {
                setSelectedUserType('admin');
                setErrorMessage('');
              }}
            >
              <span className="icon">⚙️</span>
              <span>Admin</span>
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  value={values.email}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  onChange={(e) => setValues((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  className={touched.email && errors.email ? 'error' : ''}
                />
              </div>
              {touched.email && errors.email ? <div className="error-message"><span>{errors.email}</span></div> : null}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={values.password}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  onChange={(e) => setValues((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  className={touched.password && errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" fill="#6b7280"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" fill="#6b7280" clip-rule="evenodd"/></svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18"><path fill-rule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" fill="#6b7280" clip-rule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" fill="#6b7280"/></svg>
                  )}
                </button>
              </div>
              {touched.password && errors.password ? <div className="error-message"><span>{errors.password}</span></div> : null}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="#" className="forgot-link">Forgot Password?</a>
            </div>

            {errorMessage ? <div className="alert alert-error">{errorMessage}</div> : null}

            <button type="submit" className="btn-submit" disabled={isLoading}>
              {!isLoading ? (
                <span>Sign In</span>
              ) : (
                <span className="loading-spinner">
                  <span className="spinner"></span> Signing in...
                </span>
              )}
            </button>
          </form>

          <div className="register-link">
            <p>
              Don't have an account?
              {' '}
              <a onClick={() => navigate('/register')}>Create Account</a>
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

export default LoginPage;
