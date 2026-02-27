# Permit Application Document API Guide

## API Endpoints

### 1. Create Permit Application with PDF Upload

**Endpoint**: `POST /api/permit-applications/with-pdf`

**Request Format**: `multipart/form-data`

**Parameters**:
- `application` (JSON) - Permit application details
- `file` (File) - PDF file to upload

**Example Request** (cURL):
```bash
curl -X POST http://localhost:8080/api/permit-applications/with-pdf \
  -F "application={
    \"eventTitle\":\"Festival Event\",
    \"purpose\":\"Cultural celebration\",
    \"startDateTime\":\"2026-03-01T10:00:00\",
    \"endDateTime\":\"2026-03-01T18:00:00\",
    \"permitType\":\"EVENT\",
    \"locationTag\":\"City Center\",
    \"userId\":1
  }" \
  -F "file=@/path/to/document.pdf"
```

**Response** (200 Created):
```json
{
  "applicationId": 5,
  "eventTitle": "Festival Event",
  "purpose": "Cultural celebration",
  "startDateTime": "2026-03-01T10:00:00",
  "endDateTime": "2026-03-01T18:00:00",
  "permitType": "EVENT",
  "locationTag": "City Center",
  "documentPath": "uploads/a1b2c3d4-e5f6_document.pdf",
  "documentFileName": "document.pdf",
  "status": "SUBMITTED",
  "currentStage": "DC_PENDING",
  "userId": 1,
  "complete": true
}
```

---

### 2. Download Document (Save to Local Disk)

**Endpoint**: `GET /api/permit-applications/{applicationId}/download-document`

**Purpose**: Downloads PDF file as an attachment

**Parameters**:
- `applicationId` (Path Variable) - ID of the permit application

**Example Request** (Browser):
```
GET http://localhost:8080/api/permit-applications/5/download-document
```

**Response Headers**:
```
Content-Type: application/pdf
Content-Length: 12345
Content-Disposition: attachment; filename="document.pdf"
```

**Behavior**: 
- Browser automatically downloads the file
- File is saved with its original name

**Error Responses**:
- **404 Not Found**: Application not found or document doesn't exist
- **500 Internal Server Error**: File system error

---

### 3. View Document (Display in Browser)

**Endpoint**: `GET /api/permit-applications/{applicationId}/view-document`

**Purpose**: Displays PDF file inline in the browser

**Parameters**:
- `applicationId` (Path Variable) - ID of the permit application

**Example Request** (Browser):
```
GET http://localhost:8080/api/permit-applications/5/view-document
```

**Response Headers**:
```
Content-Type: application/pdf
Content-Length: 12345
Content-Disposition: inline; filename="document.pdf"
```

**Behavior**: 
- PDF viewer opens in browser (if supported)
- File is not saved locally

**Error Responses**:
- **404 Not Found**: Application not found or document doesn't exist
- **500 Internal Server Error**: File system error

---

### 4. Get Application Details

**Endpoint**: `GET /api/permit-applications/{applicationId}`

**Purpose**: Retrieves full application details including document path

**Parameters**:
- `applicationId` (Path Variable) - ID of the permit application

**Example Request**:
```bash
curl http://localhost:8080/api/permit-applications/5
```

**Response** (200 OK):
```json
{
  "applicationId": 5,
  "eventTitle": "Festival Event",
  "purpose": "Cultural celebration",
  "startDateTime": "2026-03-01T10:00:00",
  "endDateTime": "2026-03-01T18:00:00",
  "permitType": "EVENT",
  "locationTag": "City Center",
  "documentPath": "uploads/a1b2c3d4-e5f6_document.pdf",
  "documentFileName": "document.pdf",
  "status": "SUBMITTED",
  "currentStage": "DC_PENDING",
  "userId": 1,
  "complete": true
}
```

---

## Frontend Integration Examples

### JavaScript/Fetch API

#### Download Document
```javascript
async function downloadDocument(applicationId) {
  try {
    const response = await fetch(
      `/api/permit-applications/${applicationId}/download-document`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get('content-disposition');
    const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
    const filename = filenameMatch ? filenameMatch[1] : 'document.pdf';
    
    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  } catch (error) {
    console.error('Download failed:', error);
  }
}
```

#### View Document in Modal
```javascript
async function viewDocument(applicationId) {
  try {
    const response = await fetch(
      `/api/permit-applications/${applicationId}/view-document`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get PDF blob
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Open in new window
    window.open(url);
    
    // Or embed in iframe
    // const iframe = document.getElementById('pdf-viewer');
    // iframe.src = url;
  } catch (error) {
    console.error('View failed:', error);
  }
}
```

#### Embed PDF in Iframe
```html
<iframe 
  id="pdf-viewer" 
  src="/api/permit-applications/5/view-document" 
  width="100%" 
  height="600px"
  type="application/pdf">
</iframe>
```

#### Upload Document
```javascript
async function uploadPermitApplication(formData) {
  try {
    const response = await fetch('/api/permit-applications/with-pdf', {
      method: 'POST',
      body: formData
      // Don't set Content-Type header, browser will set it
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const application = await response.json();
    console.log('Application created:', application);
    return application;
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

// Usage
const formData = new FormData();
formData.append('application', JSON.stringify({
  eventTitle: 'My Event',
  purpose: 'Event description',
  startDateTime: '2026-03-01T10:00:00',
  endDateTime: '2026-03-01T18:00:00',
  permitType: 'EVENT',
  locationTag: 'City Center',
  userId: 1
}));
formData.append('file', pdfFile); // from file input

uploadPermitApplication(formData);
```

---

## Path Resolution Details

### How Paths are Stored
- **Relative Path** (in database): `uploads/uuid_original-filename.pdf`
  - Example: `uploads/a1b2c3d4-e5f6-g7h8_document.pdf`
  
- **Absolute Path** (for file system access): `/E:/Project_Collection/NICTHOUBAL/uploads/uuid_original-filename.pdf`

### Automatic Conversion
The controller automatically converts relative paths to absolute:
```java
String absolutePath = application.getDocumentPath();
if (!new File(absolutePath).isAbsolute()) {
    Path relPath = Paths.get(absolutePath);
    absolutePath = relPath.toAbsolutePath().toString();
}
```

### File Storage Location
```
E:\Project_Collection\NICTHOUBAL\uploads\
├── a1b2c3d4-e5f6_LAMNGANBA.pdf
├── b2c3d4e5-f6g7_document.pdf
└── ...
```

---

## Error Handling

### Possible Error Responses

#### 404 Not Found
```json
{
  "error": "Document not found for application: 999"
}
```
or
```json
{
  "error": "Document file not found at path: uploads/invalid_path.pdf"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Error downloading document: File access denied"
}
```

---

## Configuration

### Application Properties
```properties
# File upload directory (relative to project root)
file.upload-dir=uploads/

# File size limits
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# Multipart upload enabled
spring.servlet.multipart.enabled=true
```

### Changing Upload Directory
To change the upload directory, update `application.properties`:
```properties
file.upload-dir=/var/uploads/permit-applications/
```

---

## Security Considerations

1. **File Validation**: Only PDF files are accepted
2. **Unique Filenames**: UUID prefix prevents name collisions
3. **Path Traversal Protection**: Files stored in dedicated `uploads/` directory
4. **File Size Limits**: Configured via `spring.servlet.multipart.max-file-size`
5. **CORS Enabled**: `@CrossOrigin("*")` on controller

---

## Performance Notes

- Files are read entirely into memory before returning
- For large PDFs, consider streaming responses
- Downloads are asynchronous (non-blocking)
- No caching currently implemented

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 404 when downloading | Check if application exists, verify document path in database |
| File not found error | Verify file exists in `uploads/` folder, check file permissions |
| 500 error | Check application logs for specific error, verify uploads directory exists |
| Large file timeout | Increase request timeout in client configuration |
| CORS error | CORS is already enabled with `@CrossOrigin("*")` |


