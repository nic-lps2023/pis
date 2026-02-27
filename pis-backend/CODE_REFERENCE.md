# Code Reference - All Changes

## 1. Entity Changes (PermitApplication.java)

### Before and After
```java
// BEFORE - Lines 35-38
@Column(nullable = false)
private String documentPath;

@Column(nullable = false)
private String documentFileName;

// AFTER - Lines 35-38
@Column(nullable = true)
private String documentPath;

@Column(nullable = true)
private String documentFileName;
```

---

## 2. Interface Addition (FileStorageService.java)

### Added Method (Lines 32-37)
```java
/**
 * Get absolute file path - converts relative path to absolute path
 * @param relativeFilePath the relative file path
 * @return the absolute file path
 */
String getAbsoluteFilePath(String relativeFilePath);
```

### Complete Interface
```java
public interface FileStorageService {

    String storePdfFile(MultipartFile file) throws IOException;

    boolean deleteFile(String filePath);

    String getFilePath(String fileName);

    String getAbsoluteFilePath(String relativeFilePath);

    boolean isPdfFile(MultipartFile file);
}
```

---

## 3. Implementation (FileStorageServiceImpl.java)

### New Method Implementation (Lines 105-130)
```java
@Override
public String getAbsoluteFilePath(String relativeFilePath) {
    if (relativeFilePath == null || relativeFilePath.isEmpty()) {
        return null;
    }
    
    try {
        // Try to create a Path from the relative path
        Path path = Paths.get(relativeFilePath);
        
        // If it's already absolute, return as is
        if (path.isAbsolute()) {
            return path.toString();
        }
        
        // Convert to absolute path relative to current working directory
        Path absolutePath = path.toAbsolutePath();
        return absolutePath.toString();
    } catch (Exception e) {
        // Fallback: just use the relative path as is
        System.err.println("Error converting to absolute path: " + e.getMessage());
        return relativeFilePath;
    }
}
```

### Complete Implementation
```java
@Service
public class FileStorageServiceImpl implements FileStorageService {

    @Value("${file.upload-dir:uploads/}")
    private String uploadDir;

    @Override
    public String storePdfFile(MultipartFile file) throws IOException {
        // Validate file
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        if (!isPdfFile(file)) {
            throw new IllegalArgumentException("File must be a PDF");
        }

        // Create uploads directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Generate unique filename
        String originalFileName = file.getOriginalFilename();
        String uniqueFileName = UUID.randomUUID() + "_" + originalFileName;
        Path filePath = uploadPath.resolve(uniqueFileName);

        // Save file to disk
        try {
            Files.copy(file.getInputStream(), filePath);
        } catch (IOException e) {
            throw new IOException("Failed to store PDF file: " + e.getMessage(), e);
        }

        // Return the path and filename for storage in database
        return uploadDir + uniqueFileName;
    }

    @Override
    public boolean deleteFile(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return false;
        }

        try {
            Path path = Paths.get(filePath);
            if (Files.exists(path)) {
                Files.delete(path);
                return true;
            }
            return false;
        } catch (IOException e) {
            System.err.println("Failed to delete file: " + filePath);
            return false;
        }
    }

    @Override
    public String getFilePath(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return null;
        }
        return uploadDir + fileName;
    }

    @Override
    public String getAbsoluteFilePath(String relativeFilePath) {
        // [See implementation above]
    }

    @Override
    public boolean isPdfFile(MultipartFile file) {
        if (file == null) {
            return false;
        }

        String contentType = file.getContentType();
        String originalFileName = file.getOriginalFilename();

        boolean isValidContentType = contentType != null &&
                (contentType.equals("application/pdf") ||
                 contentType.equals("application/x-pdf"));

        boolean isValidExtension = originalFileName != null &&
                originalFileName.toLowerCase().endsWith(".pdf");

        return isValidContentType && isValidExtension;
    }
}
```

---

## 4. Controller Changes (PermitApplicationController.java)

### Imports Added
```java
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
```

### Download Endpoint (Lines 75-115)
```java
/**
 * Download the PDF document for a specific permit application
 * @param applicationId the permit application ID
 * @return the PDF file as byte array with appropriate headers
 */
@GetMapping("/{applicationId}/download-document")
public ResponseEntity<?> downloadDocument(@PathVariable Long applicationId) {
    try {
        PermitApplicationDto application = permitApplicationService.getApplicationById(applicationId);

        if (application == null || application.getDocumentPath() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Document not found for application: " + applicationId);
        }

        // Get absolute path from the stored document path
        String absolutePath = application.getDocumentPath();
        if (!new File(absolutePath).isAbsolute()) {
            // Convert to absolute path if it's relative
            Path relPath = Paths.get(absolutePath);
            absolutePath = relPath.toAbsolutePath().toString();
        }

        File file = new File(absolutePath);
        if (!file.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Document file not found at path: " + absolutePath);
        }

        InputStream inputStream = new FileInputStream(file);
        byte[] fileContent = inputStream.readAllBytes();
        inputStream.close();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentLength(fileContent.length);
        headers.setContentDispositionFormData("attachment",
                application.getDocumentFileName() != null ? 
                application.getDocumentFileName() : "document.pdf");

        return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
    } catch (IOException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error downloading document: " + e.getMessage());
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error: " + e.getMessage());
    }
}
```

### View Endpoint (Lines 117-172)
```java
/**
 * View the PDF document for a specific permit application (inline display)
 * @param applicationId the permit application ID
 * @return the PDF file as byte array with inline content disposition
 */
@GetMapping("/{applicationId}/view-document")
public ResponseEntity<?> viewDocument(@PathVariable Long applicationId) {
    try {
        PermitApplicationDto application = permitApplicationService.getApplicationById(applicationId);

        if (application == null || application.getDocumentPath() == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Document not found for application: " + applicationId);
        }

        // Get absolute path from the stored document path
        String absolutePath = application.getDocumentPath();
        if (!new File(absolutePath).isAbsolute()) {
            // Convert to absolute path if it's relative
            Path relPath = Paths.get(absolutePath);
            absolutePath = relPath.toAbsolutePath().toString();
        }

        File file = new File(absolutePath);
        if (!file.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Document file not found at path: " + absolutePath);
        }

        InputStream inputStream = new FileInputStream(file);
        byte[] fileContent = inputStream.readAllBytes();
        inputStream.close();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentLength(fileContent.length);
        headers.setContentDispositionFormData("inline",
                application.getDocumentFileName() != null ? 
                application.getDocumentFileName() : "document.pdf");

        return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
    } catch (IOException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error viewing document: " + e.getMessage());
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error: " + e.getMessage());
    }
}
```

### Complete Controller
```java
@CrossOrigin("*")
@RestController
@AllArgsConstructor
@RequestMapping("/api/permit-applications")
public class PermitApplicationController {

    private PermitApplicationService permitApplicationService;

    @PostMapping
    public ResponseEntity<PermitApplicationDto> createApplication(@RequestBody PermitApplicationDto dto) {
        PermitApplicationDto saved = permitApplicationService.createApplication(dto);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PostMapping("/with-pdf")
    public ResponseEntity<PermitApplicationDto> createApplicationWithPdf(
            @RequestPart("application") PermitApplicationDto dto,
            @RequestPart("file") MultipartFile pdfFile) throws IOException {
        PermitApplicationDto saved = permitApplicationService.createApplicationWithPdf(dto, pdfFile);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PermitApplicationDto>> getApplicationsByUserId(@PathVariable Long userId) {
        return ResponseEntity.ok(permitApplicationService.getApplicationsByUserId(userId));
    }

    @GetMapping
    public ResponseEntity<List<PermitApplicationDto>> getAllApplications() {
        return ResponseEntity.ok(permitApplicationService.getAllApplications());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PermitApplicationDto> getApplicationById(@PathVariable Long id) {
        return ResponseEntity.ok(permitApplicationService.getApplicationById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PermitApplicationDto> updateApplication(
            @PathVariable Long id,
            @RequestBody PermitApplicationDto dto) {
        PermitApplicationDto updated = permitApplicationService.updateApplication(id, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApplication(@PathVariable Long id) {
        permitApplicationService.deleteApplication(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{applicationId}/download-document")
    public ResponseEntity<?> downloadDocument(@PathVariable Long applicationId) {
        // [See implementation above]
    }

    @GetMapping("/{applicationId}/view-document")
    public ResponseEntity<?> viewDocument(@PathVariable Long applicationId) {
        // [See implementation above]
    }
}
```

---

## Path Conversion Logic (Key Pattern)

### Used in Both Endpoints
```java
// Get absolute path from the stored document path
String absolutePath = application.getDocumentPath();
if (!new File(absolutePath).isAbsolute()) {
    // Convert to absolute path if it's relative
    Path relPath = Paths.get(absolutePath);
    absolutePath = relPath.toAbsolutePath().toString();
}

File file = new File(absolutePath);
if (!file.exists()) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body("Document file not found at path: " + absolutePath);
}
```

### Breaking Down the Logic
```java
// Step 1: Get stored path (could be relative or absolute)
String absolutePath = application.getDocumentPath();
// Example: "uploads/uuid_filename.pdf"

// Step 2: Check if path is already absolute
if (!new File(absolutePath).isAbsolute()) {
    // Step 3: If relative, convert to absolute
    Path relPath = Paths.get(absolutePath);
    // Example: Paths.get("uploads/uuid_filename.pdf")
    
    absolutePath = relPath.toAbsolutePath().toString();
    // Example: "E:\Project_Collection\NICTHOUBAL\uploads\uuid_filename.pdf"
}

// Step 4: Verify file exists
File file = new File(absolutePath);
if (!file.exists()) {
    return error;
}
```

---

## Application Properties

### File Upload Configuration
```properties
# File Storage
file.upload-dir=uploads/

# Multipart File Upload
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

---

## Database Schema (Relevant Columns)

### permit_applications Table
```sql
CREATE TABLE permit_applications (
    application_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_title VARCHAR(255) NOT NULL,
    purpose VARCHAR(2000) NOT NULL,
    start_date_time TIMESTAMP NOT NULL,
    end_date_time TIMESTAMP NOT NULL,
    permit_type VARCHAR(255) NOT NULL,
    location_tag VARCHAR(255) NOT NULL,
    document_path VARCHAR(500),  -- Changed to nullable
    document_file_name VARCHAR(500),  -- Changed to nullable
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    current_stage VARCHAR(50) NOT NULL DEFAULT 'DC_PENDING',
    dc_remarks VARCHAR(2000),
    sp_remarks VARCHAR(2000),
    sdpo_remarks VARCHAR(2000),
    oc_report VARCHAR(4000),
    user_id BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

---

## Sample API Calls

### Upload
```bash
curl -X POST http://localhost:8080/api/permit-applications/with-pdf \
  -F "application={\"eventTitle\":\"Event\",\"userId\":1}" \
  -F "file=@document.pdf"
```

### Download
```bash
curl -O -J http://localhost:8080/api/permit-applications/5/download-document
# -O: save to file
# -J: use original filename
```

### View
```bash
curl http://localhost:8080/api/permit-applications/5/view-document > output.pdf
```

### Get Details
```bash
curl http://localhost:8080/api/permit-applications/5 | jq
```

---

## Verification Checklist

- [x] Entity nullable fields: PermitApplication.java (lines 35-38)
- [x] Interface method: FileStorageService.java (lines 32-37)
- [x] Implementation: FileStorageServiceImpl.java (lines 105-130)
- [x] Download endpoint: PermitApplicationController.java (lines 75-115)
- [x] View endpoint: PermitApplicationController.java (lines 117-172)
- [x] Path conversion logic: Used in both endpoints
- [x] Error handling: Comprehensive in all endpoints
- [x] Imports: All necessary imports added

---

## Files Status

| File | Status | Changes | Lines |
|------|--------|---------|-------|
| PermitApplication.java | ✅ Complete | Made fields nullable | 35-38 |
| FileStorageService.java | ✅ Complete | Added method declaration | 32-37 |
| FileStorageServiceImpl.java | ✅ Complete | Implemented method | 105-130 |
| PermitApplicationController.java | ✅ Complete | Added 2 endpoints + imports | 1-172 |

---

This document serves as a complete code reference for all changes made to fix the document path issues.


