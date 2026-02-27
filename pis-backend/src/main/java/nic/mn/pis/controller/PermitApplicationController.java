package nic.mn.pis.controller;

import lombok.AllArgsConstructor;
import nic.mn.pis.dto.PermitApplicationDto;
import nic.mn.pis.service.PermitApplicationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

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
                    application.getDocumentFileName() != null ? application.getDocumentFileName() : "document.pdf");

            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error downloading document: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

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
                    application.getDocumentFileName() != null ? application.getDocumentFileName() : "document.pdf");

            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error viewing document: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }
}
