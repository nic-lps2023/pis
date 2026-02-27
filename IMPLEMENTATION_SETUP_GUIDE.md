# Permit Application System - Implementation Setup Guide

## Quick Start

This guide walks you through setting up the complete workflow system for permit applications.

## Prerequisites

- Node.js (frontend)
- Java 11+ (backend)
- PostgreSQL database
- Maven or Gradle (backend build tool)

## Frontend Setup

### Step 1: Install Dependencies
```bash
cd pis-frontend
npm install
```

### Step 2: Verify New Components Exist
Ensure these files are created in `src/components/authority/`:
- `AuthorityInbox.jsx` (updated)
- `SPDashboard.jsx` (new)
- `SDPODashboard.jsx` (new)
- `OCDashboard.jsx` (new)

### Step 3: Update Routing (Optional - Enhanced Routes)
Update `src/App.jsx` to include specific routes for each dashboard type:

```javascript
import SPDashboard from "./components/authority/SPDashboard";
import SDPODashboard from "./components/authority/SDPODashboard";
import OCDashboard from "./components/authority/OCDashboard";

// Add these routes to your Routes component:

{/* SP Dashboard - Role 2 */}
<Route
  path="/sp/dashboard"
  element={
    <PrivateRoute allowedRoles={[2]}>
      <SPDashboard />
    </PrivateRoute>
  }
/>

{/* SDPO Dashboard - Role 3 */}
<Route
  path="/sdpo/dashboard"
  element={
    <PrivateRoute allowedRoles={[3]}>
      <SDPODashboard />
    </PrivateRoute>
  }
/>

{/* OC Dashboard - Role 4 */}
<Route
  path="/oc/dashboard"
  element={
    <PrivateRoute allowedRoles={[4]}>
      <OCDashboard />
    </PrivateRoute>
  }
/>
```

### Step 4: Start Frontend
```bash
npm run dev
```

## Backend Setup

### Step 1: Update Service Interface
Ensure file exists: `src/main/java/nic/mn/pis/service/AuthorityService.java`

### Step 2: Update Service Implementation
Component: `src/main/java/nic/mn/pis/service/impl/AuthorityServiceImpl.java`

### Step 3: Update Controller
File: `src/main/java/nic/mn/pis/controller/AuthorityController.java`

### Step 4: Update Entities & DTOs
- Entity: `src/main/java/nic/mn/pis/entity/PermitApplication.java`
- DTO: `src/main/java/nic/mn/pis/dto/PermitApplicationDto.java`

### Step 5: Build Backend
```bash
cd pis-backend
mvn clean install
# or
gradle clean build
```

### Step 6: Run Backend
```bash
mvn spring-boot:run
# or
java -jar target/pis-0.0.1-SNAPSHOT.jar
```

Backend should run on `http://localhost:8080`

## Database Configuration

### Step 1: Create Database
```sql
CREATE DATABASE pis;
```

### Step 2: Configure Connection
In `application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/pis
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.jpa.hibernate.ddl-auto=update
```

### Step 3: Insert Required Roles

Execute these SQL queries:

```sql
-- Insert roles for permit application workflow
INSERT INTO roles (role_id, role_name) VALUES
(1, 'ADMIN'),
(2, 'DEPUTY_COMMISSIONER'),
(3, 'SUB_DIVISIONAL_POLICE_OFFICER'),
(4, 'OFFICER_IN_CHARGE'),
(5, 'AUTHORITY'),
(6, 'RESERVED'),
(7, 'APPLICANT')
ON CONFLICT DO NOTHING;
```

### Step 4: Verify Tables
Tables created automatically by Hibernate:
- `roles` ✅
- `users` ✅
- `permit_applications` ✅

## Role ID Reference

| ID | Role Name | Dashboard | Inbox Stage |
|---|-----------|-----------|-------------|
| 1 | ADMIN | N/A | N/A |
| 2 | DEPUTY_COMMISSIONER | AuthorityInbox / DC | DC_PENDING |
| 3 | SUB_DIVISIONAL_POLICE_OFFICER | SDPODashboard | SDPO_PENDING / SDPO_REVIEW_PENDING |
| 4 | OFFICER_IN_CHARGE | OCDashboard | OC_PENDING |
| 5 | AUTHORITY | SPDashboard | SP_PENDING / SP_REVIEW_PENDING |
| 6 | RESERVED | - | - |
| 7 | APPLICANT | N/A | N/A |

## Creating Test Users

### Test User 1: Deputy Commissioner
```javascript
{
  "fullName": "John Deputy Commissioner",
  "email": "dc@example.com",
  "password": "password123",
  "phoneNumber": "9876543210",
  "gender": "MALE",
  "roleId": 2
}
```

### Test User 2: State Police (SP)
```javascript
{
  "fullName": "Sarah State Police",
  "email": "sp@example.com",
  "password": "password123",
  "phoneNumber": "9876543211",
  "gender": "FEMALE",
  "roleId": 5
}
```

### Test User 3: SDPO
```javascript
{
  "fullName": "Mike SDPO",
  "email": "sdpo@example.com",
  "password": "password123",
  "phoneNumber": "9876543212",
  "gender": "MALE",
  "roleId": 3
}
```

### Test User 4: OC
```javascript
{
  "fullName": "Emma Officer",
  "email": "oc@example.com",
  "password": "password123",
  "phoneNumber": "9876543213",
  "gender": "FEMALE",
  "roleId": 4
}
```

### Test User 5: Applicant
```javascript
{
  "fullName": "Alex Applicant",
  "email": "applicant@example.com",
  "password": "password123",
  "phoneNumber": "9876543214",
  "gender": "MALE",
  "roleId": 7
}
```

## API Endpoints

### Authority Workflow Endpoints
```
GET    /api/authority/inbox/{stage}           - Get applications by stage
PUT    /api/authority/dc/forward-sp/{id}      - DC: Forward to SP
PUT    /api/authority/sp/forward-sdpo/{id}    - SP: Forward to SDPO
PUT    /api/authority/sdpo/forward-oc/{id}    - SDPO: Forward to OC
PUT    /api/authority/oc/report/{id}          - OC: Submit report
PUT    /api/authority/sdpo/forward-sp/{id}    - SDPO: Forward OC report to SP
PUT    /api/authority/sp/recommend-dc/{id}    - SP: Recommend to DC
PUT    /api/authority/dc/approve/{id}         - DC: Approve & generate permit
PUT    /api/authority/dc/reject/{id}          - DC: Reject application
```

### Example: Forward to SP (DC)
```bash
curl -X PUT http://localhost:8080/api/authority/dc/forward-sp/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "remarks": "Initial review complete, forwarding for further processing"
  }'
```

## Testing Workflow

### Complete Test Scenario

#### 1. Login as Applicant
- Navigate to `/login`
- Use applicant credentials
- Submit permit application with PDF document

#### 2. Login as DC
- Navigate to `/login`
- Use DC credentials
- Go to `/authority/inbox`
- Should see DC_PENDING applications
- Forward to SP with remarks
- Status changes to FORWARDED_TO_SP

#### 3. Login as SP
- Navigate to `/login`
- Use SP credentials  
- Go to `/authority/inbox`
- Should see SP_PENDING applications
- Forward to SDPO with remarks

#### 4. Login as SDPO
- Navigate to `/login`
- Use SDPO credentials
- Go to `/sdpo/dashboard`
- Assign application to OC

#### 5. Login as OC
- Navigate to `/login`
- Use OC credentials
- Go to `/oc/dashboard`
- Download/review documents
- Submit verification report

#### 6. Verification
- Login as SDPO - see OC report
- Forward to SP with assessment
- Login as SP - see full report
- Recommend to DC

#### 7. Final Decision
- Login as DC
- Go to `/authority/inbox`
- Should see DC_FINAL_PENDING applications
- Approve or Reject

## Frontend Component File Locations

```
pis-frontend/src/
├── components/
│   ├── authority/
│   │   ├── AuthorityInbox.jsx          (✅ Updated)
│   │   ├── AuthorityDashboard.jsx      (Existing)
│   │   ├── AuthorityApplicationDetails.jsx (Existing)
│   │   ├── SPDashboard.jsx             (✨ New)
│   │   ├── SDPODashboard.jsx           (✨ New)
│   │   └── OCDashboard.jsx             (✨ New)
│   └── ...
├── services/
│   └── AuthorityService.js             (✅ Updated with viewDocument)
└── ...
```

## Backend File Locations

```
pis-backend/src/main/java/nic/mn/pis/
├── service/
│   ├── AuthorityService.java           (✨ New Interface)
│   └── impl/
│       └── AuthorityServiceImpl.java    (✅ Updated)
├── controller/
│   └── AuthorityController.java        (✅ Updated)
├── entity/
│   └── PermitApplication.java          (✅ Updated with docs)
└── dto/
    └── PermitApplicationDto.java       (✅ Updated with docs)
```

## Troubleshooting

### Issue: "User role not found"
**Solution**: Check that `roleName` is stored in localStorage after login. Verify AuthController is setting roleName in LoginResponse.

### Issue: Inbox shows no applications
**Solution**: 
- Verify applications exist in DB with correct `currentStage`
- Check user role to stage mapping in AuthorityInbox.jsx
- Verify stage name matches exactly (case-sensitive)

### Issue: Forward button not showing
**Solution**: 
- Check `isDC` flag - verify user role is "DEPUTY_COMMISSIONER"
- Verify application `currentStage` is exactly "DC_PENDING"
- Check browser console for errors

### Issue: PDF download fails
**Solution**:
- Verify file exists at configured `file.upload-dir` path
- Check that documentFileName is not null
- Ensure PermitApplicationController document endpoints are working

### Issue: Modal doesn't close after action
**Solution**:
- Check for JavaScript errors in browser console
- Verify API response is successful (200 status)
- Check that setShowForwardModal(false) is being called

## Performance Optimization

For production deployment:

1. **Database Indexing**: Add indexes on frequently queried columns
```sql
CREATE INDEX idx_applications_stage ON permit_applications(current_stage);
CREATE INDEX idx_applications_user ON permit_applications(user_id);
```

2. **Caching**: Implement Spring Cache for role lookups
3. **Pagination**: Add pagination to inbox queries
4. **Compression**: Enable gzip compression in Spring

## Security Recommendations

1. **JWT Token Expiration**: Currently 1 hour - adjust in JwtUtil.java
2. **File Upload**: Implement virus scanning for PDFs
3. **SQL Injection**: Parameterized queries (already done via JPA)
4. **CORS**: Update CORS policy for production domain
5. **Role Validation**: Add authorization checks in AuthorityController

## Documentation Files Created

1. **WORKFLOW_IMPLEMENTATION_GUIDE.md** - Complete workflow documentation
2. **IMPLEMENTATION_SETUP_GUIDE.md** - This file (setup instructions)

## Support & Contact

For issues or questions:
- Check WORKFLOW_IMPLEMENTATION_GUIDE.md for detailed workflow info
- Review component code comments for implementation details
- Check logs for error messages and stack traces
- Verify database configuration in application.properties

## Next Steps

1. ✅ Frontend components created
2. ✅ Backend services updated
3. ✅ Database schema ready (auto-created)
4. ⬜ Create test users
5. ⬜ Test complete workflow
6. ⬜ Deploy to production
7. ⬜ Monitor logs and metrics
8. ⬜ Gather feedback for improvements
