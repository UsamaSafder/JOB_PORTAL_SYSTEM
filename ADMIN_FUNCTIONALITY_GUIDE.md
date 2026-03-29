# Admin Panel Functionality Guide

## Overview
All admin functionalities have been made fully dynamic and functional. The admin panel now connects to the backend API for real-time data management.

---

## Checklist: Making All Functionalities Work

### ✅ 1. Backend Setup
- [x] All required endpoints exist in `Backend/routes/users.js`
- [x] Controllers implemented in `Backend/controllers/userController.js`
- [x] Authentication middleware properly configured
- [x] System logging enabled

### ✅ 2. Frontend Setup
- [x] AdminService created (`src/app/services/admin.service.ts`)
- [x] HttpClient properly configured in `app.config.ts`
- [x] All components integrated with AdminService
- [x] Error handling and loading states added
- [x] Proper Authorization headers with JWT token

### ✅ 3. API Endpoints Implemented

#### Dashboard Stats
```
GET /api/users/admin/dashboard-stats
Response: {
  "stats": {
    "totalCompanies": number,
    "totalCandidates": number,
    "totalJobs": number,
    "activeJobs": number,
    "totalApplications": number,
    "pendingApplications": number,
    "activeUsers": number,
    "inactiveUsers": number
  }
}
```

#### Get All Candidates
```
GET /api/users/admin/candidates
Response: {
  "candidates": [...]
}
```

#### Get All Companies
```
GET /api/users/admin/companies
Response: {
  "companies": [...]
}
```

#### Get All Jobs
```
GET /api/jobs
Response: {
  "jobs": [...]
}
```

#### Toggle User Status
```
PUT /api/users/admin/{userId}/toggle-status
Response: {
  "message": "User activated/deactivated successfully",
  "isActive": boolean
}
```

#### Verify Company
```
PUT /api/users/admin/{companyId}/verify-company
Response: {
  "message": "Company verified successfully",
  "isVerified": true
}
```

#### Toggle Job Status
```
PATCH /api/jobs/{jobId}/toggle-status
Response: {
  "message": "Job activated/deactivated successfully",
  "job": {...}
}
```

#### Delete Job
```
DELETE /api/jobs/{jobId}
Response: {
  "message": "Job deleted successfully"
}
```

#### Get System Logs
```
GET /api/users/admin/logs
Response: {
  "logs": [...]
}
```

---

## Component Functionalities

### 1. Admin Dashboard (`admin-dashboard.ts`)
**Features:**
- ✅ Real-time statistics display
- ✅ Recent activities list from system logs
- ✅ Pending company verifications
- ✅ Quick action buttons to navigate to management sections
- ✅ Verify/Reject company buttons with API calls

**How it Works:**
1. Loads dashboard statistics from backend on component initialization
2. Fetches system logs for recent activities
3. Fetches unverified companies for pending verifications section
4. All data is real-time from the database

### 2. Manage Candidates (`manage-candidates.ts`)
**Features:**
- ✅ Load all candidates from database
- ✅ Real-time search by name, email, or skills
- ✅ Filter by active/inactive status
- ✅ View candidate details in modal
- ✅ Toggle candidate active status
- ✅ Delete candidates
- ✅ Skills preview with truncation

**How it Works:**
1. On initialization, fetches all candidates from backend
2. Filtering and searching done on frontend (instant feedback)
3. Toggle status makes PATCH API call to update database
4. Delete operation removes from display and logs action
5. All changes are persisted to database

### 3. Manage Companies (`manage-companies.ts`)
**Features:**
- ✅ Load all companies from database
- ✅ Real-time search by name, industry, or location
- ✅ Filter by verified/unverified status
- ✅ View company details in modal
- ✅ Verify companies with API call
- ✅ Toggle company active status
- ✅ Delete companies
- ✅ Display statistics (verified, unverified, active count)

**How it Works:**
1. Fetches all companies from backend on load
2. Verify button makes PUT API call to mark company as verified
3. Toggle status calls API to toggle company active status
4. All state changes are reflected to database and logged
5. Real-time statistics calculated from company array

### 4. Manage Jobs (`manage-jobs-admin.ts`)
**Features:**
- ✅ Load all jobs from database
- ✅ Real-time search by title, company, or location
- ✅ Filter by employment type (Full-time, Part-time, etc.)
- ✅ Filter by active/inactive status
- ✅ View job details in modal
- ✅ Toggle job status (active/inactive)
- ✅ Delete jobs
- ✅ Display application counts
- ✅ Deadline warning system (highlight jobs expiring soon)

**How it Works:**
1. Loads all jobs from backend on initialization
2. Toggle status makes PATCH API call to update job status
3. Delete operation makes DELETE API call to remove job
4. Jobs are filtered and searched on frontend for instant feedback
5. Deadline calculation determines if job expires within 7 days

### 5. System Logs (`system-logs.ts`)
**Features:**
- ✅ Load all system logs from database
- ✅ Real-time search by action or username
- ✅ Filter by user type (Admin, Candidate, Company)
- ✅ Filter by date range (Today, Last 7 days, Last 30 days, All)
- ✅ Pagination (25 items per page)
- ✅ Export logs to JSON file
- ✅ Clear logs older than 30 days
- ✅ Relative time display (e.g., "2 hours ago")
- ✅ Action type color coding

**How it Works:**
1. Fetches system logs from backend on initialization
2. Filtering and pagination done on frontend
3. Export creates a JSON file with current filtered logs
4. Clear old logs removes logs older than 30 days from display
5. Time formatting shows relative time for better UX

---

## How to Test Each Feature

### Test 1: View Dashboard
```
1. Login as admin
2. Navigate to /admin/dashboard
3. Should see:
   - Real-time statistics (Companies, Candidates, Jobs, Applications)
   - Recent activities list
   - Pending company verifications
   - Quick action buttons
```

### Test 2: Manage Candidates
```
1. Navigate to /admin/candidates
2. Should see:
   - List of all candidates from database
   - Active and inactive candidate counts
   - Search box and status filter
3. Try:
   - Searching for a candidate by name
   - Filtering by active/inactive status
   - Clicking "View" to see full details
   - Toggling status (should update database immediately)
   - Deleting a candidate (should remove from list)
```

### Test 3: Manage Companies
```
1. Navigate to /admin/companies
2. Should see:
   - List of all companies from database
   - Verified and unverified company counts
   - Search box and verification filter
3. Try:
   - Searching for a company
   - Filtering by verified/unverified status
   - Verifying an unverified company
   - Toggling company active status
   - Deleting a company
```

### Test 4: Manage Jobs
```
1. Navigate to /admin/jobs
2. Should see:
   - All job postings from database
   - Active job count and total applications
   - Search, employment type, and status filters
3. Try:
   - Searching for jobs by title
   - Filtering by Full-time, Part-time, etc.
   - Toggling job status (active/inactive)
   - Deleting a job posting
   - Jobs with deadlines within 7 days should be highlighted
```

### Test 5: View System Logs
```
1. Navigate to /admin/logs
2. Should see:
   - System logs from database
   - User type counts
   - Search, type filter, and date range filter
   - Pagination controls
3. Try:
   - Searching by action name
   - Filtering by user type
   - Filtering by date range
   - Navigating between pages
   - Exporting logs to JSON
   - Clearing logs older than 30 days
```

---

## Common Issues & Solutions

### Issue: "Authentication required" error
**Solution:**
- Ensure admin is logged in before accessing admin routes
- Check that JWT token is stored in localStorage
- Token should be valid and not expired

### Issue: "You do not have permission" error
**Solution:**
- Make sure logged-in user is an admin
- Check user role in token is set to 'admin'
- Verify admin routes have `authorize('admin')` middleware

### Issue: Data not loading
**Solution:**
- Check browser console for errors
- Ensure backend server is running on port 5001
- Verify API endpoint URLs match backend routes
- Check that Authorization header is being sent with request

### Issue: Changes not persisting
**Solution:**
- Verify API response status is 200/201
- Check that database update succeeded
- Ensure changes are being sent to backend (not just updated locally)
- Look for errors in backend console logs

---

## Architecture Overview

```
Frontend (Angular)
├── Components
│   ├── admin-dashboard.ts
│   ├── manage-candidates.ts
│   ├── manage-companies.ts
│   ├── manage-jobs-admin.ts
│   └── system-logs.ts
│
├── Services
│   └── admin.service.ts
│
└── Models
    └── HTTP calls via HttpClient

Backend (Node.js/Express)
├── Routes
│   └── routes/users.js
│
├── Controllers
│   └── controllers/userController.js
│
├── Models
│   ├── User.js
│   ├── Company.js
│   ├── Candidate.js
│   ├── Job.js
│   └── SystemLog.js
│
└── Database
    └── SQL Server (JobPortalDB)
```

---

## API Response Handling

All services include proper error handling and response mapping:
- `map()` operator extracts data from nested responses
- `catchError()` operator handles HTTP errors gracefully
- Components check for Array vs Object responses
- Loading states prevent UI issues during data fetch
- User-friendly error messages in alerts

---

## Security Features

✅ JWT Token-based authentication
✅ Authorization checks for admin role
✅ HTTPS-ready (update API URL in production)
✅ Role-based access control
✅ System logging for all admin actions
✅ CORS properly configured

---

## Performance Optimizations

✅ Frontend filtering for instant search/filter feedback
✅ Pagination for large data sets (System Logs)
✅ Error handling prevents app crashes
✅ Loading states for better UX
✅ Efficient array operations for data manipulation

---

## Next Steps / Future Enhancements

- [ ] Add bulk operations (delete multiple candidates/jobs)
- [ ] Add advanced filtering options
- [ ] Add export to CSV functionality
- [ ] Add date range picker for better date filtering
- [ ] Add refresh button on each component
- [ ] Add confirmation dialogs with better styling
- [ ] Add success notifications on actions
- [ ] Add pagination to candidates and companies lists
- [ ] Add sorting options to all tables

---

## File Locations

- **Admin Service:** `src/app/services/admin.service.ts`
- **Admin Components:** `src/app/admin/*/`
- **Backend Routes:** `Backend/routes/users.js`
- **Backend Controllers:** `Backend/controllers/userController.js`
- **Models:** `Backend/models/`

---

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check backend server logs
3. Verify database connection
4. Ensure all dependencies are installed
5. Restart both frontend and backend services
