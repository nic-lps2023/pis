# Permit Application Workflow Implementation Guide

## Overview

This document provides a comprehensive guide to the complete permit application workflow system, from applicant submission through final Deputy Commissioner decision.

## Complete Workflow Steps

```
1. Applicant submits permit application → SUBMITTED (DC_PENDING)
2. Deputy Commissioner reviews and forwards to SP → FORWARDED_TO_SP (SP_PENDING)
3. State Police reviews and forwards to SDPO → FORWARDED_TO_SDPO (SDPO_PENDING)
4. SDPO assigns to OC for physical verification → FORWARDED_TO_OC (OC_PENDING)
5. OC conducts investigation and submits report → OC_VERIFIED (SDPO_REVIEW_PENDING)
6. SDPO reviews OC report and forwards to SP → SDPO_REVIEWED (SP_REVIEW_PENDING)
7. SP reviews all reports and recommends to DC → SP_RECOMMENDED (DC_FINAL_PENDING)
8. DC makes final decision → APPROVED/REJECTED (COMPLETED)
```

## Application Status & Stage Mapping

### Status Values (Application State)
- **SUBMITTED**: Initial submission by applicant
- **FORWARDED_TO_SP**: DC forwarded to State Police
- **FORWARDED_TO_SDPO**: SP forwarded to SDPO
- **FORWARDED_TO_OC**: SDPO forwarded to OC
- **OC_VERIFIED**: OC submitted verification report
- **SDPO_REVIEWED**: SDPO reviewed and forwarded
- **SP_RECOMMENDED**: SP provided recommendation
- **APPROVED**: DC approved - Permit generated
- **REJECTED**: DC rejected application

### Stage Values (Current Authority/Role)
- **DC_PENDING**: Awaiting Deputy Commissioner action
- **SP_PENDING**: Awaiting State Police action
- **SDPO_PENDING**: Awaiting SDPO action
- **OC_PENDING**: Awaiting Officer-in-Charge verification
- **SDPO_REVIEW_PENDING**: SDPO reviewing OC report
- **SP_REVIEW_PENDING**: SP reviewing all reports
- **DC_FINAL_PENDING**: DC making final decision
- **COMPLETED**: Workflow completed

## Authority Roles & Responsibilities

### Deputy Commissioner (DC)
**Role ID**: To be configured in database
**Responsibilities**:
- ✅ Review incomplete/complete applications
- ✅ Download/View applicant documents
- ✅ Forward applications to SP (from DC_PENDING)
- ✅ Grant final approval/rejection (from DC_FINAL_PENDING)
- ✅ Add remarks at each stage

**Dashboard**: AuthorityInbox.jsx
**Key Actions**:
- Forward to SP (DC_PENDING stage)
- Approve (DC_FINAL_PENDING stage)
- Reject (DC_FINAL_PENDING stage)

### State Police (SP)
**Role**: "AUTHORITY"
**Responsibilities**:
- ✅ Review applications forwarded by DC
- ✅ Forward to SDPO for field verification
- ✅ Review OC verification report and SDPO assessment
- ✅ Recommend to DC with recommendation

**Dashboard**: SPDashboard.jsx
**Tabs**:
- Pending (SP_PENDING): Forward to SDPO
- For Review (SP_REVIEW_PENDING): Recommend to DC
- Add remarks/recommendations

### Sub-Divisional Police Officer (SDPO)
**Role**: "SUB_DIVISIONAL_POLICE_OFFICER"
**Responsibilities**:
- ✅ Receive applications from SP
- ✅ Assign to OC for physical verification
- ✅ Review OC verification report
- ✅ Forward assessment to SP

**Dashboard**: SDPODashboard.jsx
**Tabs**:
- Assign to OC (SDPO_PENDING): Forward to OC
- OC Reports (SDPO_REVIEW_PENDING): Forward to SP
- Add assignment details and review remarks

### Officer-in-Charge (OC)
**Role**: "OFFICER_IN_CHARGE"
**Responsibilities**:
- ✅ View complete application details
- ✅ Conduct physical verification
- ✅ Investigation and assessment
- ✅ Submit detailed investigation report

**Dashboard**: OCDashboard.jsx
**Key Actions**:
- View application details
- Download/review documents
- Submit investigation report

## Frontend Components

### Updated Components

#### 1. AuthorityInbox.jsx
**Location**: `src/components/authority/AuthorityInbox.jsx`
**Features**:
- Display applications in DC_PENDING stage
- Download/view document button
- Forward to SP button with modal for remarks
- View full details button
- Better table layout with status badges

**Key Methods**:
- `handleForwardToSP()`: Send to SP
- `handleDownloadDocument()`: Download PDF
- `openForwardModal()`: Open forward dialog

### New Components Created

#### 2. SPDashboard.jsx
**Location**: `src/components/authority/SPDashboard.jsx`
**Features**:
- Tab navigation (Pending / For Review)
- Forward to SDPO (from pending)
- Recommend to DC (from for review)
- Document download
- View details navigation

#### 3. SDPODashboard.jsx
**Location**: `src/components/authority/SDPODashboard.jsx`
**Features**:
- Tab navigation (Assign to OC / OC Reports)
- Forward to OC with assignment details
- Forward to SP after reviewing OC report
- Document download
- View details navigation

#### 4. OCDashboard.jsx
**Location**: `src/components/authority/OCDashboard.jsx`
**Features**:
- Display OC_PENDING applications
- View complete application details
- Download applicant document
- Submit investigation report modal
- Word count display in report textarea

## Backend Services

### AuthorityService Interface
**Location**: `src/main/java/nic/mn/pis/service/AuthorityService.java`

**Methods**:
```java
List<PermitApplicationDto> getInboxByStage(String stage);
PermitApplicationDto forwardToSP(Long id, String remarks);
PermitApplicationDto forwardToSDPO(Long id, String remarks);
PermitApplicationDto forwardToOC(Long id, String remarks);
PermitApplicationDto submitOCReport(Long id, String report);
PermitApplicationDto forwardToSPFromSDPO(Long id, String remarks);
PermitApplicationDto recommendToDC(Long id, String remarks);
PermitApplicationDto approveByDC(Long id, String remarks);
PermitApplicationDto rejectByDC(Long id, String remarks);
```

### AuthorityServiceImpl
**Location**: `src/main/java/nic/mn/pis/service/impl/AuthorityServiceImpl.java`
**Implementation notes**:
- Validates application exists
- Updates status and current stage
- Stores remarks/reports in appropriate fields
- Returns updated DTO

### AuthorityController
**Location**: `src/main/java/nic/mn/pis/controller/AuthorityController.java`

**Endpoints**:
```
GET  /api/authority/inbox/{stage}           - Get applications by stage
PUT  /api/authority/dc/forward-sp/{id}      - DC forward to SP
PUT  /api/authority/sp/forward-sdpo/{id}    - SP forward to SDPO
PUT  /api/authority/sdpo/forward-oc/{id}    - SDPO forward to OC
PUT  /api/authority/oc/report/{id}          - OC submit report
PUT  /api/authority/sdpo/forward-sp/{id}    - SDPO forward to SP
PUT  /api/authority/sp/recommend-dc/{id}    - SP recommend to DC
PUT  /api/authority/dc/approve/{id}         - DC approve
PUT  /api/authority/dc/reject/{id}          - DC reject
```

## Database Changes

### PermitApplication Entity Updates
**File**: `src/main/java/nic/mn/pis/entity/PermitApplication.java`

**Existing Fields** (no changes needed):
- `applicationId`: Primary key
- `eventTitle`, `purpose`, `permitType`, `locationTag`: Event details
- `startDateTime`, `endDateTime`: Event schedule
- `documentPath`, `documentFileName`: Application document
- `status`: Main application state
- `currentStage`: Current role/authority
- `dcRemarks`, `spRemarks`, `sdpoRemarks`, `ocReport`: Authority feedback
- `user`: Reference to applicant

**Column Lengths**:
- `dcRemarks`: 2000 characters
- `spRemarks`: 2000 characters
- `sdpoRemarks`: 2000 characters
- `ocReport`: 4000 characters

## API Request/Response Examples

### Forward to SP (DC)
**Request**:
```json
{
  "remarks": "Initial review complete, forwarding for further processing"
}
```

**Response**:
```json
{
  "applicationId": 1,
  "eventTitle": "Community Event",
  "status": "FORWARDED_TO_SP",
  "currentStage": "SP_PENDING",
  "dcRemarks": "Initial review complete, forwarding for further processing",
  "userId": 10
}
```

### Submit OC Report
**Request**:
```json
{
  "report": "Physical verification completed. Event location verified. Safety measures adequate. No issues found. Recommend approval."
}
```

**Response**:
```json
{
  "applicationId": 1,
  "status": "OC_VERIFIED",
  "currentStage": "SDPO_REVIEW_PENDING",
  "ocReport": "Physical verification completed. Event location verified. Safety measures adequate. No issues found. Recommend approval."
}
```

## Role-Stage Mapping for Auth

**Frontend**: `src/components/authority/AuthorityInbox.jsx`
```javascript
const roleStageMap = {
  "DEPUTY_COMMISSIONER": "DC_PENDING",
  "AUTHORITY": "SP_PENDING",
  "SUB_DIVISIONAL_POLICE_OFFICER": "SDPO_PENDING",
  "OFFICER_IN_CHARGE": "OC_PENDING"
};
```

## Configuration Required

### 1. Database Roles
Ensure these roles exist in `roles` table:
- ID: 1, Name: "DEPUTY_COMMISSIONER"
- ID: 2, Name: "AUTHORITY" (State Police)
- ID: 3, Name: "SUB_DIVISIONAL_POLICE_OFFICER"
- ID: 4, Name: "OFFICER_IN_CHARGE"
- ID: 7, Name: "APPLICANT"

### 2. Test Users
Create test users for each role to verify workflow:
- DC user with role DEPUTY_COMMISSIONER
- SP user with role AUTHORITY
- SDPO user with role SUB_DIVISIONAL_POLICE_OFFICER
- OC user with role OFFICER_IN_CHARGE
- Applicant user with role APPLICANT

### 3. Frontend Routing
Add routes for dashboards in your main routing file:
```javascript
<Route path="/authority/dashboard" element={<AuthorityInbox />} />
<Route path="/sp/dashboard" element={<SPDashboard />} />
<Route path="/sdpo/dashboard" element={<SDPODashboard />} />
<Route path="/oc/dashboard" element={<OCDashboard />} />
```

## Testing the Workflow

1. **Create Application**: Login as applicant, submit permit with document
2. **DC Processing**: Login as DC, forward to SP with remarks
3. **SP Processing**: Login as SP, forward to SDPO
4. **SDPO Processing**: Login as SDPO, assign to OC
5. **OC Processing**: Login as OC, submit investigation report
6. **SDPO Review**: Login as SDPO, forward completed review to SP
7. **SP Review**: Login as SP, recommend to DC
8. **DC Final**: Login as DC, approve or reject

## Workflow Diagram

```
┌──────────┐
│ Applicant│
└────┬─────┘
     │ Submit
     ▼
┌────────────┐
│ DC PENDING │
└─────┬──────┘
      │ Forward(DC)
      ▼
┌────────────┐
│ SP PENDING │
└─────┬──────┘
      │ Forward(SP)
      ▼
┌────────────────┐
│ SDPO PENDING   │
└─────┬──────────┘
      │ Assign(SDPO)
      ▼
┌────────────┐
│ OC PENDING │
└─────┬──────┘
      │ Submit Report(OC)
      ▼
┌──────────────────────┐
│ SDPO REVIEW PENDING  │
└─────┬────────────────┘
      │ Forward(SDPO)
      ▼
┌────────────────┐
│ SP REVIEW PENDING   │
└─────┬──────────────┘
      │ Recommend(SP)
      ▼
┌──────────────────┐
│ DC FINAL PENDING│
└─────┬────────────┘
      ├─ Approve(DC) ──→ APPROVED ──→ ✅ COMPLETED (Permit Generated)
      └─ Reject(DC) ───→ REJECTED ──→ ❌ COMPLETED
```

## Notes & Important Points

1. **Status & Stage Distinction**:
   - **Status**: Represents overall state in workflow (SUBMITTED, FORWARDED_TO_SP, etc.)
   - **Stage**: Indicates which authority should process it (DC_PENDING, SP_PENDING, etc.)

2. **Remarks Flow**:
   - DC adds remarks in `dcRemarks` field
   - SP adds remarks in `spRemarks` field
   - SDPO adds remarks in `sdpoRemarks` field
   - OC adds detailed report in `ocReport` field

3. **Role Navigation**:
   - Each role can only see applications in their respective stage
   - Use localStorage to store `roleName` from login response
   - Frontend maps role to appropriate stage for querying

4. **Document Handling**:
   - Documents stored in `uploads/` directory (configurable)
   - Two endpoints: download (attachment) and view (inline)
   - File validation ensures only PDFs are accepted

5. **Security Notes**:
   - All authority endpoints require authentication (JWT token)
   - Validate user role matches requested action
   - Add authorization checks in controller/service layer if needed

## Future Enhancements

1. Add email notifications at each stage transition
2. Add permit generation and download for approved applications
3. Add appeal mechanism for rejected applications
4. Track approval timeline and metrics
5. Add bulk operations for authorities
6. Implement audit trail for all changes
7. Add communication/notes between authorities
8. Add application status history timeline view
