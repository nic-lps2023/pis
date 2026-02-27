# Permit Application Workflow - Visual Reference

## Complete Workflow State Diagram

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                    PERMIT APPLICATION                        │
                    │                    WORKFLOW STATES                          │
                    └─────────────────────────────────────────────────────────────┘

                                         🔵 SUBMITTED
                                         Stage: DC_PENDING
                                         (Applicant → DC)
                                              │
                                              │ Forward to SP
                                              ▼
                                    🟢 FORWARDED_TO_SP
                                    Stage: SP_PENDING
                                    (DC → SP)
                                              │
                                              │ Forward to SDPO
                                              ▼
                                  🟡 FORWARDED_TO_SDPO
                                  Stage: SDPO_PENDING
                                  (SP → SDPO)
                                              │
                                              │ Assign to OC
                                              ▼
                                    🟠 FORWARDED_TO_OC
                                    Stage: OC_PENDING
                                    (SDPO → OC)
                                              │
                                              │ Submit Report
                                              ▼
                                      🔵 OC_VERIFIED
                                      Stage: SDPO_REVIEW_PENDING
                                      (OC → SDPO)
                                              │
                                              │ Review & Forward
                                              ▼
                                      🟡 SDPO_REVIEWED
                                      Stage: SP_REVIEW_PENDING
                                      (SDPO → SP)
                                              │
                                              │ Recommend
                                              ▼
                                    🟢 SP_RECOMMENDED
                                    Stage: DC_FINAL_PENDING
                                    (SP → DC)
                                              │
                        ┌──────────────────┴──────────────────┐
                        │                                     │
                        │ Approve                    Reject   │
                        ▼                                     ▼
                    ✅ APPROVED               ❌ REJECTED
                    🎫 Permit Generated       Application Rejected
                    Stage: COMPLETED          Stage: COMPLETED
```

## Authority Role and Responsibilities

```
╔════════════════════════════════════════════════════════════════════════╗
║                    AUTHORITY WORKFLOW ASSIGNMENTS                      ║
╚════════════════════════════════════════════════════════════════════════╝

┌─ APPLICANT (Role ID: 7) ─────────────────────────────────────────────┐
│ Actions:                                                              │
│ • Submit permit application with document                            │
│ • View own applications and status                                  │
│ • Initial Status: SUBMITTED → DC_PENDING                            │
└────────────────────────────────────────────────────────────────────────┘

┌─ DEPUTY COMMISSIONER (Role ID: 2) ───────────────────────────────────┐
│ Stages Managed: DC_PENDING, DC_FINAL_PENDING                         │
│                                                                       │
│ Stage 1: DC_PENDING                                                  │
│ Actions:                                                              │
│ ✓ View incomplete/complete applications                             │
│ ✓ Download/View documentation                                       │
│ ✓ Forward to SP (from inbox or details view) ⭐ NEW FEATURE         │
│ ✓ Add remarks                                                        │
│ → Next: Forward to SP                                               │
│                                                                       │
│ Stage 2: DC_FINAL_PENDING                                            │
│ Actions:                                                              │
│ ✓ Review recommendations from all authorities                       │
│ ✓ View complete audit trail (all remarks)                           │
│ ✓ Approve application → APPROVED (🎫 Permit Generated)              │
│ ✓ Reject application → REJECTED                                     │
│ → Next: Workflow Complete                                           │
└────────────────────────────────────────────────────────────────────────┘

┌─ STATE POLICE / AUTHORITY (Role ID: 5) ──────────────────────────────┐
│ Stages Managed: SP_PENDING, SP_REVIEW_PENDING                        │
│                                                                       │
│ Stage 1: SP_PENDING                                                  │
│ Actions:                                                              │
│ ✓ View applications forwarded by DC                                 │
│ ✓ Download/View documentation                                       │
│ ✓ Forward to SDPO                                                    │
│ ✓ Add remarks                                                        │
│ Dashboard: SPDashboard.jsx (Pending tab)                            │
│ → Next: Forward to SDPO                                             │
│                                                                       │
│ Stage 2: SP_REVIEW_PENDING                                           │
│ Actions:                                                              │
│ ✓ Review complete application with all reports                      │
│ ✓ Review DC remarks, SDPO remarks, OC report                        │
│ ✓ Recommend to DC                                                    │
│ ✓ Add final remarks/recommendation                                  │
│ Dashboard: SPDashboard.jsx (For Review tab)                         │
│ → Next: Recommend to DC                                             │
└────────────────────────────────────────────────────────────────────────┘

┌─ SDPO (Role ID: 3) ──────────────────────────────────────────────────┐
│ Stages Managed: SDPO_PENDING, SDPO_REVIEW_PENDING                    │
│                                                                       │
│ Stage 1: SDPO_PENDING                                                │
│ Actions:                                                              │
│ ✓ View applications from SP                                         │
│ ✓ Download/View documentation                                       │
│ ✓ Assign to OC for physical verification                            │
│ ✓ Add assignment details/remarks                                    │
│ Dashboard: SDPODashboard.jsx (Assign to OC tab)                     │
│ → Next: Assign to OC                                                │
│                                                                       │
│ Stage 2: SDPO_REVIEW_PENDING                                         │
│ Actions:                                                              │
│ ✓ Review OC's investigation report                                  │
│ ✓ Download/View OC report with application                          │
│ ✓ Forward to SP with assessment                                     │
│ ✓ Add review remarks                                                │
│ Dashboard: SDPODashboard.jsx (OC Reports tab)                       │
│ → Next: Forward to SP                                               │
└────────────────────────────────────────────────────────────────────────┘

┌─ OFFICER-IN-CHARGE (Role ID: 4) ────────────────────────────────────┐
│ Stages Managed: OC_PENDING                                           │
│                                                                       │
│ Actions:                                                              │
│ ✓ View applications assigned by SDPO                                │
│ ✓ Download/View application documents                               │
│ ✓ Conduct physical verification at event location                   │
│ ✓ Submit detailed investigation report                              │
│ ✓ Verify safety measures, location authenticity                     │
│ Dashboard: OCDashboard.jsx                                          │
│ → Next: Submit investigation report                                 │
│                                                                       │
│ OC Report Includes:                                                  │
│ • Event location verification                                       │
│ • Safety and security assessment                                    │
│ • Concerns or observations                                          │
│ • Recommendation (Approve/Reject with justification)               │
└────────────────────────────────────────────────────────────────────────┘
```

## Frontend Component Mapping

```
┌──────────────────────────────────────────────────────────────────────┐
│                 FRONTEND COMPONENT TO ROLE MAPPING                   │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ COMPONENT: AuthorityInbox.jsx                                        │
│ Default Dashboard for All Authorities                                │
│ Shows applications based on role → stage mapping                    │
│                                                                      │
│ Role-to-Stage Mapping:                                              │
│ ├─ DEPUTY_COMMISSIONER      → DC_PENDING                           │
│ ├─ AUTHORITY (SP)           → SP_PENDING                           │
│ ├─ SUB_DIVISIONAL_POLICE_OFFICER → SDPO_PENDING                    │
│ └─ OFFICER_IN_CHARGE        → OC_PENDING                           │
│                                                                      │
│ Features (Updated):                                                  │
│ ├─ Forward to SP button (DC only, DC_PENDING stage)                │
│ ├─ Download document button                                         │
│ ├─ Modal for capturing remarks                                      │
│ ├─ Status badges                                                    │
│ └─ Navigate to details view                                         │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ COMPONENT: SPDashboard.jsx                                           │
│ State Police Dashboard (Optional - Can use AuthorityInbox)          │
│ Role: AUTHORITY (Role ID: 5)                                        │
│ Stages: SP_PENDING, SP_REVIEW_PENDING                               │
│                                                                      │
│ Tabs:                                                                │
│ ├─ Pending Applications (SP_PENDING)                                │
│ │  └─ Action: Forward to SDPO                                       │
│ │                                                                   │
│ └─ For Review (SP_REVIEW_PENDING)                                   │
│    └─ Action: Recommend to DC                                       │
│                                                                      │
│ Features:                                                            │
│ ├─ Tab navigation                                                   │
│ ├─ Modal for remarks/recommendations                                │
│ ├─ Document download                                                │
│ ├─ View details link                                                │
│ └─ Loading and error states                                         │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ COMPONENT: SDPODashboard.jsx                                         │
│ SDPO Dashboard (Optional - Can use AuthorityInbox)                  │
│ Role: SUB_DIVISIONAL_POLICE_OFFICER (Role ID: 3)                   │
│ Stages: SDPO_PENDING, SDPO_REVIEW_PENDING                           │
│                                                                      │
│ Tabs:                                                                │
│ ├─ Assign to OC (SDPO_PENDING)                                      │
│ │  └─ Action: Forward to OC                                         │
│ │                                                                   │
│ └─ OC Reports (SDPO_REVIEW_PENDING)                                 │
│    └─ Action: Forward to SP                                         │
│                                                                      │
│ Features:                                                            │
│ ├─ Tab navigation                                                   │
│ ├─ Modal for assignment details and remarks                         │
│ ├─ Document download                                                │
│ ├─ View details link                                                │
│ └─ Loading and error states                                         │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ COMPONENT: OCDashboard.jsx                                           │
│ Officer-in-Charge Dashboard (Required)                              │
│ Role: OFFICER_IN_CHARGE (Role ID: 4)                                │
│ Stage: OC_PENDING                                                    │
│                                                                      │
│ Features:                                                            │
│ ├─ Display all OC_PENDING applications                              │
│ ├─ Show event details comprehensively                               │
│ ├─ Document download button                                         │
│ ├─ View application details link                                    │
│ └─ Submit Investigation Report:                                     │
│    ├─ Modal dialog                                                  │
│    ├─ Textarea for detailed report                                  │
│    ├─ Word count display                                            │
│    └─ Alert about report requirements                               │
│                                                                      │
│ Table Columns:                                                       │
│ ├─ ID                                                               │
│ ├─ Event Title                                                      │
│ ├─ Event Date                                                       │
│ ├─ Permit Type                                                      │
│ ├─ Location                                                         │
│ ├─ Purpose (truncated)                                              │
│ ├─ Document                                                         │
│ └─ Actions                                                          │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ COMPONENT: AuthorityApplicationDetails.jsx                          │
│ Shared Details View for All Authorities                             │
│ Shows complete application with all remarks/reports                 │
│                                                                      │
│ Displays:                                                            │
│ ├─ Application ID, Event Title, Permit Type                        │
│ ├─ Status and Current Stage badges                                 │
│ ├─ Event details (purpose, start/end dates)                        │
│ ├─ DC Remarks (if present)                                         │
│ ├─ SP Remarks (if present)                                         │
│ ├─ SDPO Remarks (if present)                                       │
│ ├─ OC Investigation Report (if present)                            │
│ ├─ Document download link                                          │
│ └─ Role-based action buttons                                       │
│                                                                      │
│ DC_PENDING Stage (DC Only):                                         │
│ └─ Forward to SP button                                             │
│                                                                      │
│ DC_FINAL_PENDING Stage (DC Only):                                   │
│ ├─ Approve & Generate Permit button                                │
│ └─ Reject Application button                                       │
│                                                                      │
│ SP_PENDING Stage (SP Only):                                         │
│ └─ Forward to SDPO button                                          │
│                                                                      │
│ SDPO_PENDING Stage (SDPO Only):                                     │
│ └─ Forward to OC button                                            │
│                                                                      │
│ OC_PENDING Stage (OC Only):                                         │
│ └─ Submit OC Report button                                         │
│                                                                      │
│ SDPO_REVIEW_PENDING Stage (SDPO Only):                              │
│ └─ Forward to SP button                                            │
│                                                                      │
│ SP_REVIEW_PENDING Stage (SP Only):                                  │
│ └─ Recommend to DC button                                          │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Structure Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    PERMIT APPLICATION ENTITY                         │
└──────────────────────────────────────────────────────────────────────┘

PermitApplication {
  
  ♦️ Identifiers
  ├─ Long applicationId           [PK]
  └─ Long userId                  [FK → User]

  📋 Event Information
  ├─ String eventTitle
  ├─ String purpose               [2000 chars]
  ├─ LocalDateTime startDateTime
  ├─ LocalDateTime endDateTime
  ├─ String permitType
  └─ String locationTag

  📄 Document Information
  ├─ String documentPath
  └─ String documentFileName

  🔄 Workflow State
  ├─ String status                [Current workflow status]
  │  ├─ SUBMITTED
  │  ├─ FORWARDED_TO_SP
  │  ├─ FORWARDED_TO_SDPO
  │  ├─ FORWARDED_TO_OC
  │  ├─ OC_VERIFIED
  │  ├─ SDPO_REVIEWED
  │  ├─ SP_RECOMMENDED
  │  ├─ APPROVED         [✅ Success]
  │  └─ REJECTED         [❌ Denied]
  │
  └─ String currentStage          [Which authority to process]
     ├─ DC_PENDING
     ├─ SP_PENDING
     ├─ SDPO_PENDING
     ├─ OC_PENDING
     ├─ SDPO_REVIEW_PENDING
     ├─ SP_REVIEW_PENDING
     ├─ DC_FINAL_PENDING
     └─ COMPLETED

  💬 Remarks and Reports
  ├─ String dcRemarks             [2000 chars - Deputy Commissioner]
  ├─ String spRemarks             [2000 chars - State Police]
  ├─ String sdpoRemarks           [2000 chars - SDPO]
  └─ String ocReport              [4000 chars - Officer-in-Charge]
}
```

## API Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         API FLOW DIAGRAM                            │
└─────────────────────────────────────────────────────────────────────┘

1️⃣  GET /api/authority/inbox/{stage}
    ├─ Input: stage = "DC_PENDING"
    ├─ Process: Query applications by current stage
    └─ Output: List<PermitApplicationDto>

2️⃣  PUT /api/authority/dc/forward-sp/{id}
    ├─ Input: applicationId, remarks
    ├─ Process: Update status & stage, store DC remarks
    ├─ Old State: status="SUBMITTED", stage="DC_PENDING"
    └─ New State: status="FORWARDED_TO_SP", stage="SP_PENDING"

3️⃣  PUT /api/authority/sp/forward-sdpo/{id}
    ├─ Input: applicationId, remarks
    ├─ Process: Update status & stage, store SP remarks
    ├─ Old State: status="FORWARDED_TO_SP", stage="SP_PENDING"
    └─ New State: status="FORWARDED_TO_SDPO", stage="SDPO_PENDING"

4️⃣  PUT /api/authority/sdpo/forward-oc/{id}
    ├─ Input: applicationId, remarks
    ├─ Process: Update status & stage, store SDPO remarks
    ├─ Old State: status="FORWARDED_TO_SDPO", stage="SDPO_PENDING"
    └─ New State: status="FORWARDED_TO_OC", stage="OC_PENDING"

5️⃣  PUT /api/authority/oc/report/{id}
    ├─ Input: applicationId, report
    ├─ Process: Update status & stage, store OC report
    ├─ Old State: status="FORWARDED_TO_OC", stage="OC_PENDING"
    └─ New State: status="OC_VERIFIED", stage="SDPO_REVIEW_PENDING"

6️⃣  PUT /api/authority/sdpo/forward-sp/{id}
    ├─ Input: applicationId, remarks
    ├─ Process: Update status & stage, add more SDPO remarks
    ├─ Old State: status="OC_VERIFIED", stage="SDPO_REVIEW_PENDING"
    └─ New State: status="SDPO_REVIEWED", stage="SP_REVIEW_PENDING"

7️⃣  PUT /api/authority/sp/recommend-dc/{id}
    ├─ Input: applicationId, remarks/recommendation
    ├─ Process: Update status & stage, store SP recommendation
    ├─ Old State: status="SDPO_REVIEWED", stage="SP_REVIEW_PENDING"
    └─ New State: status="SP_RECOMMENDED", stage="DC_FINAL_PENDING"

8️⃣  PUT /api/authority/dc/approve/{id}
    ├─ Input: applicationId, remarks
    ├─ Process: Update status & stage, generate permit
    ├─ Old State: status="SP_RECOMMENDED", stage="DC_FINAL_PENDING"
    └─ New State: status="APPROVED", stage="COMPLETED" ✅

9️⃣  PUT /api/authority/dc/reject/{id}
    ├─ Input: applicationId, rejection reason
    ├─ Process: Update status & stage, store rejection reason
    ├─ Old State: status="SP_RECOMMENDED", stage="DC_FINAL_PENDING"
    └─ New State: status="REJECTED", stage="COMPLETED" ❌
```

## Key Features & Capabilities

```
✅ COMPLETED FEATURES

Application Submission:
  ✓ Applicant submits application with event details
  ✓ PDF document upload support
  ✓ Automatic status: SUBMITTED, stage: DC_PENDING

Application Processing:
  ✓ Multi-stage approval workflow
  ✓ Role-based access control
  ✓ Remarks and feedback collection at each stage
  ✓ Document management and downloads
  ✓ Complete audit trail

Authority Actions:
  ✓ DC: Forward to SP (NEW - from inbox directly)
  ✓ SP: Forward to SDPO, Recommend to DC
  ✓ SDPO: Assign to OC, Review OC reports
  ✓ OC: Submit investigation reports
  ✓ DC: Final approval or rejection

Dashboard Features:
  ✓ Role-specific dashboards showing relevant applications
  ✓ Tab navigation for different work queues
  ✓ Document download from all dashboards
  ✓ Status tracking and badges
  ✓ Application details view with complete history

Workflow Management:
  ✓ Automatic status/stage transitions
  ✓ Proper validation at each step
  ✓ Error handling and user feedback
  ✓ Loading states and user experience

⬜ POTENTIAL FUTURE ENHANCEMENTS

  ○ Email notifications at each workflow stage
  ○ Permit document generation and download
  ○ Application appeal mechanism
  ○ Analytics and approval metrics
  ○ Bulk operations for authorities
  ○ Complete audit trail/history view
  ○ Communication/notes between authorities
  ○ Application timeline visualization
  ○ Search and filtering capabilities
  ○ Export to PDF/Excel reports
```

## Testing Workflow Sequence

```
STEP 1: APPLICANT SUBMISSION
┌─────────────────────────────────────┐
│ Applicant logs in                   │
│ Creates permit application          │
│ Uploads PDF document                │
│ Submits                             │
└─────────────────────────────────────┘
Result: Status=SUBMITTED, Stage=DC_PENDING

        ↓

STEP 2: DC INITIAL REVIEW
┌─────────────────────────────────────┐
│ Deputy Commissioner logs in          │
│ Goes to /authority/inbox            │
│ Sees DC_PENDING applications        │
│ Clicks "View Details" or           │
│ Clicks "Forward →" button from      │
│ inbox (NEW FEATURE)                 │
│ Enters remarks in modal             │
│ Forwards to SP                      │
└─────────────────────────────────────┘
Result: Status=FORWARDED_TO_SP, Stage=SP_PENDING

        ↓

STEP 3: STATE POLICE REVIEW
┌─────────────────────────────────────┐
│ State Police logs in                 │
│ Goes to /authority/inbox or        │
│ SPDashboard                         │
│ Sees SP_PENDING applications       │
│ Views details and documents         │
│ Enters remarks                      │
│ Forwards to SDPO                    │
└─────────────────────────────────────┘
Result: Status=FORWARDED_TO_SDPO, Stage=SDPO_PENDING

        ↓

STEP 4: SDPO ASSIGNMENT
┌─────────────────────────────────────┐
│ SDPO logs in                         │
│ Goes to /authority/inbox or        │
│ SDPODashboard                      │
│ Sees SDPO_PENDING applications    │
│ Assigns application to OC           │
│ Enters assignment details           │
│ Forwards to OC                      │
└─────────────────────────────────────┘
Result: Status=FORWARDED_TO_OC, Stage=OC_PENDING

        ↓

STEP 5: OC PHYSICAL VERIFICATION
┌─────────────────────────────────────┐
│ Officer-in-Charge logs in           │
│ Goes to /oc/dashboard               │
│ Sees OC_PENDING applications       │
│ Downloads applicant document        │
│ Conducts physical verification      │
│ Prepares investigation report       │
│ Submits report via modal            │
└─────────────────────────────────────┘
Result: Status=OC_VERIFIED, Stage=SDPO_REVIEW_PENDING

        ↓

STEP 6: SDPO REVIEW & FORWARD
┌─────────────────────────────────────┐
│ SDPO logs in                         │
│ Switches to "OC Reports" tab        │
│ Reviews OC investigation           │
│ Enters assessment remarks           │
│ Forwards to SP                      │
└─────────────────────────────────────┘
Result: Status=SDPO_REVIEWED, Stage=SP_REVIEW_PENDING

        ↓

STEP 7: STATE POLICE FINAL REVIEW
┌─────────────────────────────────────┐
│ State Police logs in                 │
│ Switches to "For Review" tab        │
│ Reviews complete application       │
│ Reviews all remarks                 │
│ Provides recommendation to DC       │
└─────────────────────────────────────┘
Result: Status=SP_RECOMMENDED, Stage=DC_FINAL_PENDING

        ↓

STEP 8: DC FINAL DECISION
┌─────────────────────────────────────┐
│ Deputy Commissioner logs in          │
│ Checks DC_FINAL_PENDING inbox      │
│ Reviews all recommendations         │
│ Either:                             │
│   - Approves → Permit Generated ✅  │
│   - Rejects → Application Denied ❌ │
└─────────────────────────────────────┘
Result: Status=APPROVED/REJECTED, Stage=COMPLETED

WORKFLOW COMPLETE! 🎉
```

---

**Last Updated**: February 20, 2026
**Version**: 1.0 - Complete Implementation
