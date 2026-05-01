# Authentication & Route Protection Implementation

## Overview
This document outlines the authentication security features implemented in the Job Portal System, including route protection and password reset functionality.

## Features Implemented

### 1. Route Protection (Frontend)
- **ProtectedRoute Component**: Created a React component that prevents unauthorized access to protected routes
- **Location**: `src/react/src/components/ProtectedRoute.jsx`
- **Functionality**:
  - Checks for authentication token in localStorage
  - Validates user role matches required permissions
  - Redirects to login page if not authenticated
  - Redirects to home page if user doesn't have required role

### 2. Protected Routes
The following routes are now protected and require authentication:

#### Company Routes (role: 'company')
- `/company/dashboard`
- `/company/post-job`
- `/company/manage-jobs`
- `/company/applications`
- `/company/support`
- `/company/profile`

#### Candidate Routes (role: 'candidate')
- `/candidate/dashboard`
- `/candidate/browse-jobs`
- `/candidate/job-details/:id`
- `/candidate/my-applications`
- `/candidate/profile`
- `/candidate/messages`
- `/candidate/manage-resume`
- `/candidate/my-interviews`

#### Admin Routes (role: 'admin')
- `/admin/dashboard`
- `/admin/support`
- `/admin/companies`
- `/admin/jobs`
- `/admin/candidates`
- `/admin/logs`

### 3. Forgot Password Feature

#### Backend Implementation
Three new API endpoints have been added to the authentication controller:

**POST /api/auth/forgot-password**
- Accepts user's email address
- Generates a 6-digit OTP
- Stores OTP in database (expires in 10 minutes)
- Sends OTP to user's email via nodemailer
- Returns success message

```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

**POST /api/auth/verify-otp**
- Accepts email and OTP
- Validates OTP against stored value
- Checks OTP expiration
- Generates temporary reset token (valid for 15 minutes)
- Returns reset token for password update

```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","otp":"123456"}'
```

**POST /api/auth/reset-password**
- Accepts reset token and new password
- Validates token integrity
- Verifies password confirmation
- Updates password and clears OTP
- Returns success message

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "resetToken":"<token>",
    "newPassword":"newpass123",
    "confirmPassword":"newpass123"
  }'
```

#### Frontend Implementation
Two new pages have been added:

**ForgotPasswordPage** (`src/react/src/pages/ForgotPasswordPage.jsx`)
- Collects user's email address
- Sends request to `/api/auth/forgot-password`
- Displays success/error messages
- Automatically redirects to reset password page after successful OTP send

**ResetPasswordPage** (`src/react/src/pages/ResetPasswordPage.jsx`)
- Step 1: Verify OTP
  - Accepts email and OTP
  - Calls `/api/auth/verify-otp`
  - Receives reset token
- Step 2: Set New Password
  - Accepts new password and confirmation
  - Calls `/api/auth/reset-password`
  - Redirects to login page after successful reset

#### Login Page Enhancement
- Added "Forgot Password?" link on login page
- Link navigates to ForgotPasswordPage
- Smooth integration with existing authentication flow

## Database Schema Changes

### User Model
Added two new fields to support password reset:
```javascript
resetOTP: { type: String, default: null },
resetOTPExpiry: { type: Date, default: null }
```

## Email Configuration

### Setup Instructions

1. **For Gmail Users**:
   - Enable 2-Factor Authentication on your Google Account
   - Visit https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Generate an App Password (16 characters)

2. **Update .env file**:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password-16chars
   ```

3. **For Other Email Services**:
   - Update `EMAIL_SERVICE` to your provider (e.g., outlook, yahoo)
   - Update `EMAIL_USER` and `EMAIL_PASSWORD` accordingly
   - Refer to [Nodemailer Transport Configuration](https://nodemailer.com/smtp/)

### Email Service Configuration
- Location: `Backend/utils/emailService.js`
- Functions:
  - `generateOTP()`: Generates 6-digit random code
  - `sendPasswordResetOTP(email, otp)`: Sends OTP via email
  - `sendWelcomeEmail(email, name)`: Optional welcome email

## Security Considerations

1. **OTP Expiration**: OTPs expire after 10 minutes
2. **Reset Token Expiration**: Reset tokens expire after 15 minutes
3. **Password Requirements**: Minimum 6 characters
4. **Password Hashing**: Uses bcryptjs for secure password storage
5. **JWT Validation**: All protected routes validate JWT token
6. **Role-Based Access Control**: Routes check user role before allowing access

## Testing the Features

### Test Case 1: Access Protected Route Without Login
1. Go to `http://localhost:5173/company/dashboard`
2. Expected: Redirected to `/login` page

### Test Case 2: Access Protected Route With Wrong Role
1. Login as a candidate
2. Try to access `http://localhost:5173/company/dashboard`
3. Expected: Redirected to home page

### Test Case 3: Complete Password Reset Flow
1. Go to `/login`
2. Click "Forgot Password?"
3. Enter email address
4. Check email for OTP
5. Enter OTP on reset page
6. Enter new password
7. Click "Reset Password"
8. Login with new password

## Dependencies Added
- **nodemailer** (^6.9.x): Email sending library

## Files Created/Modified

### New Files:
- `Backend/utils/emailService.js`
- `src/react/src/components/ProtectedRoute.jsx`
- `src/react/src/pages/ForgotPasswordPage.jsx`
- `src/react/src/pages/ResetPasswordPage.jsx`

### Modified Files:
- `Backend/models/User.js`: Added OTP fields support
- `Backend/models/mongoCollections.js`: Updated User schema
- `Backend/controllers/authController.js`: Added 3 new endpoints
- `Backend/routes/auth.js`: Added new routes and validations
- `Backend/.env`: Added email configuration variables
- `src/react/src/App.jsx`: Added ProtectedRoute wrapping and new page routes
- `src/react/src/pages/LoginPage.jsx`: Added forgot password link

## Troubleshooting

### Email Not Sending
- Verify `EMAIL_USER` and `EMAIL_PASSWORD` are correct in .env
- Check if 2-Factor Authentication is enabled (for Gmail)
- Check server logs for error messages
- Try with a test email account

### OTP Not Received
- Check spam/junk folder
- Verify email configuration is correct
- Check database if OTP was stored
- Try requesting new OTP

### Reset Token Invalid
- Token expires after 15 minutes, request new reset
- Ensure token hasn't been modified
- Check if multiple reset attempts were made

## Future Enhancements
- Add rate limiting to prevent OTP abuse
- Add email verification during signup
- Add SMS-based OTP option
- Add password strength requirements
- Add multi-factor authentication (2FA)
- Add login attempt tracking and account lockout
