# Quick Start - Testing Admin Panel

## Prerequisites
✅ Backend running on port 5001
✅ Frontend running on port 4200
✅ Admin user created (arshadkashaf1@gmail.com / 123456)
✅ Admin logged in and JWT token stored

---

## Step-by-Step Testing

### Step 1: Verify Backend is Running
```powershell
cd Backend
npm start
# Should show: ✓ Server running on port 5001
```

### Step 2: Verify Frontend is Running
```powershell
npm start
# Should show Angular dev server running on localhost:4200
```

### Step 3: Login as Admin
```
1. Go to http://localhost:4200/login
2. Email: arshadkashaf1@gmail.com
3. Password: 123456
4. Click Login
5. You should be redirected to /admin/dashboard
```

### Step 4: Test Admin Dashboard
```
URL: http://localhost:4200/admin/dashboard

What to Check:
✅ Statistics cards showing (Companies, Candidates, Jobs, Applications)
✅ Recent Activities section populated
✅ Pending Verifications section showing unverified companies
✅ Quick Actions buttons working (click to navigate)
✅ Refresh Data button loads fresh data
```

### Step 5: Test Manage Candidates
```
URL: http://localhost:4200/admin/candidates

What to Test:
1. Data Loading
   - Should display all candidates from database
   - Count of active candidates shown
   - Count of inactive candidates shown

2. Search
   - Type candidate name in search box
   - Should filter candidates in real-time

3. Filter by Status
   - Select "active" to show only active candidates
   - Select "inactive" to show only inactive candidates

4. View Details
   - Click "View" button on a candidate
   - Should open modal with full details

5. Toggle Status
   - Click "Toggle Status" button
   - Should toggle active/inactive
   - Confirm alert appears
   - Status updates in database
   - List refreshes automatically

6. Delete
   - Click "Delete" button
   - Confirm alert appears
   - Candidate removed from list
   - Action logged in database
```

### Step 6: Test Manage Companies
```
URL: http://localhost:4200/admin/companies

What to Test:
1. Data Loading
   - All companies display from database
   - Verified/Unverified counts shown
   - Active companies count shown

2. Search & Filter
   - Search by company name
   - Filter by verified/unverified status
   - Real-time results

3. Verify Company
   - Find an unverified company
   - Click "Verify" button
   - isVerified flag updates in database
   - Company moves to verified section

4. Toggle Status
   - Click "Toggle Status"
   - Active status flips
   - Database updates

5. View Details
   - Click "View" button
   - Modal shows company information
```

### Step 7: Test Manage Jobs
```
URL: http://localhost:4200/admin/jobs

What to Test:
1. Data Loading
   - All jobs display from database
   - Active job count accurate
   - Total applications count shown

2. Search & Filter
   - Search by job title/company/location
   - Filter by employment type
   - Filter by active/inactive status

3. Toggle Job Status
   - Click "Toggle Status"
   - Job isActive flag flips
   - Reflected in database

4. Delete Job
   - Click "Delete"
   - Confirm dialog
   - Job removed from database and list

5. Deadline Warnings
   - Jobs expiring in 7 days should be highlighted
   - Visual indicator showing deadline near
```

### Step 8: Test System Logs
```
URL: http://localhost:4200/admin/logs

What to Test:
1. Load Logs
   - All system logs display from database
   - User type counts accurate
   - 25 items per page

2. Search
   - Type action name (e.g., "verified")
   - Results filter in real-time

3. Filter by User Type
   - Filter by Admin, Candidate, or Company
   - Shows only matching logs

4. Filter by Date Range
   - Today: Shows logs from today only
   - Week: Shows logs from last 7 days
   - Month: Shows logs from last 30 days
   - All: Shows all logs

5. Pagination
   - First page shows first 25 logs
   - Click "Next" to go to next page
   - Click "Previous" to go to previous page
   - Current page displayed

6. Export
   - Click "Export Logs"
   - JSON file downloads with all filtered logs
   - File named: system_logs_[timestamp].json

7. Clear Old Logs
   - Click "Clear Old Logs"
   - Confirm dialog
   - Logs older than 30 days removed
```

---

## Expected Test Results

### ✅ All Tests Pass When:
- Data loads correctly from database on page load
- Search and filter work instantly on frontend
- Toggle/Verify/Delete buttons call backend API
- Database updates reflected in UI without page reload
- Error messages display for failed operations
- Confirmation dialogs prevent accidental actions
- Loading indicators show during data fetch
- Pagination works correctly with multiple pages

### ❌ Tests Fail When:
- API returns 401 (not authenticated)
- API returns 403 (not authorized)
- API returns 404 (endpoint not found)
- API returns 500 (server error)
- Network error connecting to backend
- Token expired or invalid
- User role is not 'admin'

---

## Troubleshooting

### If data doesn't load:
```
1. Open browser Dev Tools (F12)
2. Go to Console tab
3. Check for error messages
4. Go to Network tab
5. Look for failed API requests
6. Check Status code of failed requests
7. Go to Backend server logs
8. Look for error messages
```

### If toggle/delete doesn't work:
```
1. Check console for "401" or "403" errors
2. Verify token is valid: localStorage.getItem('token')
3. Verify user role: decode token and check role field
4. Check backend logs for specific error
5. Verify endpoint exists in routes
```

### If database not updating:
```
1. Check backend console for SQL errors
2. Verify database connection is working
3. Run health check: GET http://localhost:5001/health
4. Check database server is running
5. Verify connection string in .env
```

---

## Browser Console Commands (for testing)

```javascript
// Check stored token
localStorage.getItem('token')

// Decode token to see claims
const token = localStorage.getItem('token')
const payload = JSON.parse(atob(token.split('.')[1]))
console.log(payload)  // Should show: { id, email, role: 'admin' }

// Test API endpoint manually
fetch('http://localhost:5001/api/users/admin/dashboard-stats', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json()).then(console.log)

// Test all candidates
fetch('http://localhost:5001/api/users/admin/candidates', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json()).then(console.log)
```

---

## Success Indicators

✅ Statistics cards update with real database data
✅ Candidate/Company/Job lists populated from database
✅ Toggle operations update database
✅ Verify operations set isVerified flag
✅ Delete operations remove records
✅ Search/Filter work instantly
✅ System logs show admin actions
✅ All CRUD operations logged to database

---

## Support

If tests fail:
1. Review error messages in console
2. Check backend logs
3. Verify database is accessible
4. Ensure token is valid
5. Confirm user role is 'admin'
6. Restart both frontend and backend if needed
