# Login Fix: Initialize Test Users

## Problem
You were getting a **401 Unauthorized** error when trying to login because no test users existed in the database yet.

## Solution
I've created an initialization endpoint and page that will set up test users for all roles.

## Step-by-Step Fix

### 1. Ensure Backend is Running
Make sure your Node.js backend server is running:
```bash
cd Backend
npm start
```

You should see:
- "Database pool created successfully"
- Server listening on port 5001

### 2. Initialize Test Users (Two Options)

#### **Option A: Using the Frontend UI (Easiest)**
1. Go to: `http://localhost:4200/init` (adjust port if needed)
2. Click the "Initialize Test Users" button
3. You'll see confirmation that test users were created
4. The page will display all test credentials

#### **Option B: Using curl/Postman**
```bash
curl -X POST http://localhost:5001/api/auth/init-test-users \
  -H "Content-Type: application/json"
```

### 3. Login with Test Credentials

After initialization, you can login with these credentials:

**Candidate Account:**
- Email: `test.candidate@example.com`
- Password: `password123`

**Company Account:**
- Email: `test.company@example.com`
- Password: `password123`

**Admin Account:**
- Email: `admin@example.com`
- Password: `password123`

## What Changed

### Backend Changes:
1. **New endpoint**: `POST /api/auth/init-test-users`
   - Location: `Backend/controllers/authController.js`
   - Creates test users with proper password hashing
   - Safe to run multiple times (won't duplicate)

2. **Updated routes**: `Backend/routes/auth.js`
   - Added the initialization route

### Frontend Changes:
1. **New service**: `src/app/services/initialization.service.ts`
   - Handles API calls for initialization
   - Provides test credentials

2. **New component**: `src/app/init/init.ts`
   - Simple UI page for initialization
   - Shows success/error messages
   - Displays test credentials after creation

3. **Updated routing**: `src/app/app.routes.ts`
   - Added `/init` route

## Files Modified
- `Backend/controllers/authController.js` - Added initializeTestUsers function
- `Backend/routes/auth.js` - Added init endpoint
- `src/app/services/initialization.service.ts` - New service
- `src/app/init/init.ts` - New component
- `src/app/app.routes.ts` - Added init route

## Troubleshooting

**If you get "Database connection error":**
- Ensure SQL Server is running
- Check your `.env` file has correct DB_SERVER, DB_USER, DB_PASSWORD
- Verify the database "JobPortalDB" exists

**If the init button doesn't work:**
- Open browser DevTools (F12)
- Check the Console tab for error messages
- Ensure both backend and frontend are running on correct ports

**If login still fails after initialization:**
- Check backend console logs for the actual error
- The logs will show: "Login attempt for email: ..." and "User found: Yes/No"
- If "User found: No", the user creation failed

## Security Note
⚠️ **Important**: The `/api/auth/init-test-users` endpoint is for development only. In production, this endpoint should be removed or protected.
