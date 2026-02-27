# Visual Architecture & Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATION                           │
│                  (Web Browser / Frontend)                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    HTTP / REST API
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│                    Spring Boot REST Controller                      │
│         PermitApplicationController                                 │
├─────────────────────────────────────────────────────────────────────┤
│  POST   /api/permit-applications/with-pdf    ← Upload with PDF     │
│  GET    /api/permit-applications/{id}        ← Get details          │
│  GET    /api/permit-applications/{id}/       ← Download PDF         │
│         download-document                                          │
│  GET    /api/permit-applications/{id}/       ← View PDF inline     │
│         view-document                                              │
│  PUT    /api/permit-applications/{id}        ← Update              │
│  DELETE /api/permit-applications/{id}        ← Delete              │
└──┬──────────────────────────────────────────────────┬───────────┬──┘
   │                                                  │           │
   ▼                                                  ▼           ▼
┌──────────────────┐  ┌─────────────────────────────────────────────┐
│   Database       │  │       File System Services                  │
│  (PostgreSQL)    │  │   FileStorageService                        │
├──────────────────┤  ├─────────────────────────────────────────────┤
│ Applications     │  │ • storePdfFile()                            │
│ ├─ appId         │  │ • deleteFile()                              │
│ ├─ docPath       │  │ • getFilePath()                             │
│ ├─ docFileName   │  │ • getAbsoluteFilePath() ✅ NEW             │
│ └─ ...           │  │ • isPdfFile()                               │
│                  │  │                                             │
│ Users            │  │ Stores files in:                            │
│ ├─ userId        │  │ uploads/ (relative path)                    │
│ ├─ username      │  │ E:\Project_Collection\                     │
│ └─ ...           │  │ NICTHOUBAL\uploads\ (absolute)             │
│                  │  │                                             │
│ Roles            │  │ Example file:                               │
│ ├─ roleId        │  │ a1b2c3d4-e5f6-g7h8_document.pdf           │
│ └─ ...           │  │                                             │
└──────────────────┘  └─────────────────────────────────────────────┘
```

---

## PDF Upload Flow Diagram

```
┌──────────────────────────┐
│  User Selects PDF File   │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  Frontend sends POST request:             │
│  /api/permit-applications/with-pdf       │
│  - application: PermitApplicationDto     │
│  - file: PDF file (multipart/form-data)  │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  PermitApplicationController              │
│  - Receives multipart request            │
│  - Extracts application data and file    │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  PermitApplicationService                │
│  - Validates PDF file                    │
│  - Calls FileStorageService              │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  FileStorageService.storePdfFile()       │
│  1. Validate PDF (content-type + ext)    │
│  2. Check uploads/ folder exists         │
│  3. Generate UUID: a1b2c3d4-e5f6         │
│  4. Create unique filename:              │
│     a1b2c3d4-e5f6_document.pdf           │
│  5. Save to disk: uploads/...            │
│  6. Return path: uploads/uuid_name.pdf   │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  File Saved Successfully                 │
│  Physical location:                      │
│  E:\Project_Collection\NICTHOUBAL\       │
│  uploads\a1b2c3d4-e5f6_document.pdf     │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  PermitApplication Entity Created        │
│  - documentPath: "uploads/uuid_name.pdf" │
│  - documentFileName: "document.pdf"      │
│  - Saved to database                     │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  Response to Client (201 Created)        │
│  {                                       │
│    "applicationId": 5,                   │
│    "documentPath": "uploads/uuid.pdf",   │
│    "documentFileName": "document.pdf",   │
│    ...                                   │
│  }                                       │
└──────────────────────────────────────────┘
```

---

## PDF Download/View Flow Diagram

```
┌────────────────────────────────────────┐
│  User Clicks Download/View Button      │
└────────────┬──────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│  Frontend sends GET request:                           │
│  /api/permit-applications/5/download-document          │
│  OR                                                    │
│  /api/permit-applications/5/view-document              │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│  PermitApplicationController                           │
│  downloadDocument() or viewDocument()                  │
│  1. Get applicationId from URL                         │
│  2. Fetch application from service                     │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│  PermitApplicationService.getApplicationById()         │
│  1. Query database for application ID 5               │
│  2. Get record with documentPath and documentFileName │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│  Check Document Path                                   │
│  documentPath: "uploads/a1b2c3d4-e5f6_document.pdf"   │
│  Is it null? NO → Continue                            │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│  Convert Path to Absolute ✅ KEY STEP               │
│  Stored: "uploads/a1b2c3d4-e5f6_document.pdf"        │
│  Check: Is it absolute? NO                            │
│  Convert: Paths.get().toAbsolutePath()                │
│  Result: "E:\Project_Collection\NICTHOUBAL\           │
│           uploads\a1b2c3d4-e5f6_document.pdf"        │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│  File System Check                                     │
│  new File(absolutePath).exists()?                      │
│  YES → Continue                                        │
│  NO → Return 404 Not Found                             │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│  Read File into Memory                                 │
│  FileInputStream → byte[]                              │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│  Set HTTP Headers                                      │
│  Content-Type: application/pdf                         │
│  Content-Length: 12345 (file size)                     │
│                                                        │
│  IF DOWNLOAD:                                          │
│  Content-Disposition: attachment;                      │
│    filename="document.pdf"                             │
│                                                        │
│  IF VIEW:                                              │
│  Content-Disposition: inline;                          │
│    filename="document.pdf"                             │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│  Return Response (200 OK)                              │
│  HTTP Headers + Binary PDF Content                     │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│  Client Receives                                       │
│                                                        │
│  DOWNLOAD: Browser saves file to Downloads folder     │
│  VIEW: Browser displays PDF inline (if supported)     │
└────────────────────────────────────────────────────────┘
```

---

## Path Resolution Flow

```
DATABASE                 APPLICATION MEMORY              FILE SYSTEM
─────────                ──────────────────              ────────────

Stored Path              ┌──────────────────────────────────────────────┐
"uploads/uuid_file.pdf"  │ Path Conversion Logic                        │
         │               │                                              │
         └──────────────►│ String path = "uploads/uuid_file.pdf"       │
                        │                                              │
                        │ Is it absolute?                              │
                        │ new File(path).isAbsolute() = false          │
                        │                                              │
                        │ NO → Convert to Absolute                     │
                        │ Path p = Paths.get(path);                   │
                        │ absolutePath =                               │
                        │   p.toAbsolutePath().toString();             │
                        │                                              │
                        └──────────────────┬────────────────────────────┘
                                           │
                                           ▼
                        "E:\Project_Collection\NICTHOUBAL\
                         uploads\uuid_file.pdf"
                                           │
                                           ▼
                        ┌──────────────────────────────────────────────┐
                        │ File System Access                           │
                        │                                              │
                        │ File f = new File(absolutePath);             │
                        │ f.exists() ?                                 │
                        │                                              │
                        │ YES → Read file                              │
                        │ NO → Return 404 Not Found                    │
                        └──────────────────────────────────────────────┘
                                           │
                                           ▼
                        ┌──────────────────────────────────────────────┐
                        │ FileInputStream                              │
                        │ → byte[] fileContent                          │
                        │ → return to client                            │
                        └──────────────────────────────────────────────┘
```

---

## Data Structure Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PermitApplicationDto                             │
├─────────────────────────────────────────────────────────────────────┤
│  - applicationId: Long                                              │
│  - eventTitle: String                                               │
│  - purpose: String                                                  │
│  - startDateTime: LocalDateTime                                     │
│  - endDateTime: LocalDateTime                                       │
│  - permitType: String                                               │
│  - locationTag: String                                              │
│  - documentPath: String ✅ (NEW: nullable)                          │
│    └─ Example: "uploads/a1b2c3d4-e5f6_document.pdf"               │
│  - documentFileName: String ✅ (NEW: nullable)                      │
│    └─ Example: "document.pdf"                                       │
│  - status: String                                                   │
│  - currentStage: String                                             │
│  - dcRemarks: String                                                │
│  - spRemarks: String                                                │
│  - sdpoRemarks: String                                              │
│  - ocReport: String                                                 │
│  - userId: Long                                                     │
│  - complete: boolean                                                │
└─────────────────────────────────────────────────────────────────────┘
           │
           ├─────────────────────────┬─────────────────────────┐
           ▼                         ▼                         ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────┐
│   PermitApplication  │   │  FileStorageService  │   │ PathConversion   │
│   (JPA Entity)       │   │  (Service Layer)     │   │ (Utility)        │
├──────────────────────┤   ├──────────────────────┤   ├──────────────────┤
│ Database Persisted   │   │ Business Logic       │   │ Converts:        │
│                      │   │                      │   │ relative → abs   │
│ @Column(nullable)    │   │ storePdfFile()       │   │                  │
│ documentPath         │   │ deleteFile()         │   │ Input:           │
│ documentFileName     │   │ getFilePath()        │   │ "uploads/uuid"   │
│                      │   │ getAbsoluteFilePath()│   │                  │
│ @Column(nullable)    │   │ isPdfFile()          │   │ Output:          │
│                      │   │                      │   │ "E:\...\uploads" │
└──────────────────────┘   └──────────────────────┘   └──────────────────┘
```

---

## Error Handling Decision Tree

```
                    ┌─────────────────────────────┐
                    │  Request to Download/View   │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │  Get Application by ID      │
                    └──────────────┬──────────────┘
                                   │
                        ┌──────────┴──────────┐
                        ▼                     ▼
                   ┌────────┐            ┌────────────┐
                   │ Found? │            │  Not Found │
                   └───┬────┘            │   404 ✓    │
                       │                 └────────────┘
                    YES│
                       ▼
         ┌─────────────────────────────┐
         │  documentPath == null?      │
         └──────────────┬──────────────┘
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
        ┌────┐                   ┌────────────┐
        │NULL│                   │  Not Null  │
        │404 │                   │            │
        └────┘                   └──────┬─────┘
                                        │
                                        ▼
                         ┌──────────────────────────────┐
                         │  Convert to Absolute Path    │
                         │  (if relative)               │
                         └──────────────┬───────────────┘
                                        │
                                        ▼
                         ┌──────────────────────────────┐
                         │  File.exists()?              │
                         └──────────────┬───────────────┘
                                        │
                           ┌────────────┴────────────┐
                           ▼                         ▼
                        ┌────┐                   ┌─────┐
                        │YES │                   │ NO  │
                        │    │                   │ 404 │
                        └──┬─┘                   └─────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  Read File       │
                  │  Set Headers     │
                  │  Return Response │
                  │      200 OK ✓    │
                  └──────────────────┘
```

---

## Changes Matrix

```
┌─────────────────────┬──────────────────────────┬──────────────┐
│ File                │ Change                   │ Impact       │
├─────────────────────┼──────────────────────────┼──────────────┤
│ PermitApplication   │ nullable documentPath    │ DB Schema    │
│ .java               │ nullable documentFileName│ Changed      │
│                     │                          │              │
│ FileStorageService  │ Add getAbsoluteFilePath()│ Interface    │
│ .java               │ method                   │ Extended     │
│                     │                          │              │
│ FileStorageService  │ Implement                │ Path Conv.   │
│ Impl.java           │ getAbsoluteFilePath()    │ Added        │
│                     │                          │              │
│ Permit              │ Add download endpoint    │ 2 New        │
│ ApplicationCtrlr    │ Add view endpoint        │ Endpoints    │
│ .java               │ Add path conversion      │ Logic        │
└─────────────────────┴──────────────────────────┴──────────────┘
```

---

## Timeline: Request Processing

```
Time: 0ms  ─────► User Clicks Button
           
Time: 5ms  ─────► HTTP Request Sent
           
Time: 10ms ─────► Controller Receives Request
           
Time: 15ms ─────► Service Queries Database
           
Time: 25ms ─────► Application Record Retrieved
           
Time: 30ms ─────► Path Extracted: "uploads/uuid.pdf"
           
Time: 35ms ─────► Path Converted to Absolute
           
Time: 40ms ─────► File System Check
           
Time: 45ms ─────► File Read into Memory
           
Time: 50ms ─────► HTTP Headers Set
           
Time: 55ms ─────► Response Returned (200 OK)
           
Time: 60ms ─────► Client Receives (Download/View)
           
           TOTAL: ~55-60ms per request
```

---

## Feature Comparison Table

```
┌──────────────────┬─────────┬─────────────┐
│ Feature          │ Before  │ After       │
├──────────────────┼─────────┼─────────────┤
│ Upload PDF       │ ✓       │ ✓           │
│ Store in DB      │ ✓       │ ✓           │
│ Save to Disk     │ ✓       │ ✓           │
│ Download PDF     │ ✗       │ ✓ NEW       │
│ View PDF         │ ✗       │ ✓ NEW       │
│ Path Resolution  │ ✗       │ ✓ NEW       │
│ Null Docs        │ ✗ ERROR │ ✓ ALLOWED   │
│ Error Handling   │ BASIC   │ COMPREHENSIVE
│ Documentation    │ ✗       │ ✓ EXTENSIVE │
└──────────────────┴─────────┴─────────────┘
```

---

This visual guide helps understand the complete architecture and data flow of the document management system.


