# Interview Reschedule Implementation Summary

## Problem
Candidates could not request to reschedule interviews when the interview was not yet scheduled (pending applications). The "Request Reschedule" button only worked if an interview had already been scheduled by the company.

## Solution
Implemented a **dual-path reschedule system** that allows candidates to request rescheduling in two scenarios:

### Path 1: Scheduled Interview Reschedule
- **Trigger**: When `interview.interviewId` exists (interview already scheduled)
- **Endpoint**: `POST /api/applications/:applicationId/interview/:interviewId/request-reschedule`
- **Service Method**: `interviewService.requestReschedule(interviewId, applicationId)`
- **Backend Handler**: `applicationController.requestReschedule`
- **Behavior**: Updates the existing interview status to 'RescheduleRequested'

### Path 2: Application-Level Reschedule (NEW)
- **Trigger**: When `interview.interviewId` is null/undefined (interview not scheduled yet)
- **Endpoint**: `POST /api/applications/:applicationId/request-reschedule`
- **Service Method**: `interviewService.requestApplicationReschedule(applicationId, reason)`
- **Backend Handler**: `applicationController.requestApplicationReschedule`
- **Behavior**: Creates a system log record indicating a reschedule request for the application

## Files Modified

### Frontend

#### 1. [src/app/candidate/my-interviews/my-interviews.ts](src/app/candidate/my-interviews/my-interviews.ts)
**Changed**: `requestReschedule()` method logic
- Added conditional check: `if (interview.interviewId)`
- **If true** (scheduled interview): Calls `this.interviewService.requestReschedule()`
- **If false** (unscheduled application): Calls `this.interviewService.requestApplicationReschedule()`
- Both paths show success/error alerts to the user

#### 2. [src/app/services/interview.service.ts](src/app/services/interview.service.ts)
**Added**: New method `requestApplicationReschedule()`
```typescript
requestApplicationReschedule(applicationId: number, reason: string): Observable<any> {
  const url = `${this.apiUrl}/${applicationId}/request-reschedule`;
  return this.http.post(url, { reason: reason }, { headers: this.getHeaders() });
}
```

### Backend

#### 3. [Backend/routes/applications.js](Backend/routes/applications.js)
**Added**: New route for application-level reschedule
```javascript
router.post(
  '/:applicationId/request-reschedule',
  auth,
  authorize('candidate'),
  applicationController.requestApplicationReschedule
);
```

#### 4. [Backend/controllers/applicationController.js](Backend/controllers/applicationController.js)
**Added**: New controller method `requestApplicationReschedule`
- Validates application exists
- Verifies candidate owns the application
- Creates a system log for the reschedule request
- Returns success response

**Existing method**: `requestReschedule` - remains unchanged for scheduled interview reschedules

## How It Works

### User Flow (Candidate):
1. Candidate views "My Interviews" page
2. For pending applications (no interview scheduled):
   - "Request Reschedule" button appears
   - Clicking button prompts for reschedule reason
   - Request sent to backend without requiring interviewId
3. For scheduled interviews:
   - "Request Reschedule" button appears
   - Clicking button prompts for reschedule reason
   - Request sent to backend with interviewId

### Backend Flow:
1. Candidate sends reschedule request (either with or without interviewId)
2. Backend validates:
   - Application exists
   - Candidate owns the application
3. If interviewId provided:
   - Updates interview status to 'RescheduleRequested'
4. If no interviewId:
   - Creates system log record for future reference
5. Returns success response to frontend

## Data Flow

```
Frontend Component (my-interviews.ts)
    ↓
    ├─ [Has interviewId?]
    │   ├─ YES: Call requestReschedule() from service
    │   └─ NO: Call requestApplicationReschedule() from service
    ↓
Interview Service (interview.service.ts)
    ├─ requestReschedule() → POST /api/applications/:applicationId/interview/:interviewId/request-reschedule
    └─ requestApplicationReschedule() → POST /api/applications/:applicationId/request-reschedule
    ↓
Backend Routes (applications.js)
    ├─ Route 1: /:applicationId/interview/:interviewId/request-reschedule
    └─ Route 2: /:applicationId/request-reschedule
    ↓
Application Controller (applicationController.js)
    ├─ requestReschedule() → Updates Interview record
    └─ requestApplicationReschedule() → Creates SystemLog record
```

## Testing Instructions

### Prerequisites:
- Candidate logged in
- At least one pending application (no interview scheduled yet)
- At least one scheduled interview

### Test Case 1: Pending Application Reschedule
1. Navigate to "My Interviews" page
2. Find a pending application (shows "Interview not scheduled yet")
3. Click "Request Reschedule" button
4. Enter reschedule reason in popup
5. Verify success message appears
6. Check backend logs for successful request

### Test Case 2: Scheduled Interview Reschedule
1. Navigate to "My Interviews" page
2. Find a scheduled interview (shows interview date/time)
3. Click "Request Reschedule" button
4. Enter reschedule reason in popup
5. Verify success message appears
6. Check interview status changed to 'RescheduleRequested'

## Backend Logging
Both methods include detailed console logging:
- Request parameters and body
- Authorization checks
- Success/error conditions
- System logs for audit trail

## Error Handling
- **404**: Application not found
- **403**: Candidate not authorized to reschedule (doesn't own application)
- **500**: Server error with detailed error message

## Future Enhancements
- Update database schema to track reschedule requests at application level
- Add notification system for companies to see reschedule requests
- Add reschedule history/timeline per application
- Company dashboard showing pending reschedule requests
