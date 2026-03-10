package nic.mn.pis.controller;

import lombok.AllArgsConstructor;
import nic.mn.pis.dto.PermitApplicationDto;
import nic.mn.pis.service.PermitApplicationService;
// import org.apache.pdfbox.pdmodel.PDDocument;
// import org.apache.pdfbox.pdmodel.PDPage;
// import org.apache.pdfbox.pdmodel.PDPageContentStream;
// import org.apache.pdfbox.pdmodel.common.PDRectangle;
// import org.apache.pdfbox.pdmodel.font.PDType1Font;
// import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

// import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
// import java.time.LocalDateTime;
// import java.time.format.DateTimeFormatter;
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

    /**
     * Download generated permit PDF for approved application
     * @param applicationId the permit application ID
     * @return generated permit file as byte array
     */
    @GetMapping("/{applicationId}/download-permit")
    public ResponseEntity<?> downloadGeneratedPermit(@PathVariable Long applicationId) {
        try {
            PermitApplicationDto application = permitApplicationService.getApplicationById(applicationId);

            if (application == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Application not found: " + applicationId);
            }

            if (!"APPROVED".equalsIgnoreCase(application.getStatus())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Permit is available only for approved applications");
            }

/*             if (application.getPermitPath() == null || application.getPermitPath().isBlank()) {
                byte[] generatedPermit = buildFallbackPermitPdf(application);
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentLength(generatedPermit.length);
                headers.setContentDispositionFormData("attachment",
                        application.getPermitFileName() != null ? application.getPermitFileName() : "permit_" + applicationId + ".pdf");

                return new ResponseEntity<>(generatedPermit, headers, HttpStatus.OK);
            } */

            String absolutePath = application.getPermitPath();
            if (!new File(absolutePath).isAbsolute()) {
                Path relPath = Paths.get(absolutePath);
                absolutePath = relPath.toAbsolutePath().toString();
            }

            File file = new File(absolutePath);
           /*  if (!file.exists()) {
                byte[] generatedPermit = buildFallbackPermitPdf(application);
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentLength(generatedPermit.length);
                headers.setContentDispositionFormData("attachment",
                        application.getPermitFileName() != null ? application.getPermitFileName() : "permit_" + applicationId + ".pdf");

                return new ResponseEntity<>(generatedPermit, headers, HttpStatus.OK);
            }
 */
            InputStream inputStream = new FileInputStream(file);
            byte[] fileContent = inputStream.readAllBytes();
            inputStream.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentLength(fileContent.length);
            headers.setContentDispositionFormData("attachment",
                    application.getPermitFileName() != null ? application.getPermitFileName() : "permit.pdf");

            return new ResponseEntity<>(fileContent, headers, HttpStatus.OK);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error downloading generated permit: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

   /*  private byte[] buildFallbackPermitPdf(PermitApplicationDto application) throws IOException {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 18);
                contentStream.newLineAtOffset(60, 760);
                contentStream.showText("Permit Issuance Certificate");

                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.newLineAtOffset(0, -40);
                contentStream.showText("Permit Number: PIS-" + application.getApplicationId());

                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Event Title: " + safeValue(application.getEventTitle()));

                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Permit Type: " + safeValue(application.getPermitType()));

                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Location: " + safeValue(application.getLocationTag()));

                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Start Date/Time: " + formatDateTime(application.getStartDateTime()));

                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("End Date/Time: " + formatDateTime(application.getEndDateTime()));

                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Applicant User ID: " + (application.getUserId() != null ? application.getUserId() : "N/A"));

                contentStream.newLineAtOffset(0, -30);
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                contentStream.showText("Approved By: Deputy Commissioner");

                contentStream.newLineAtOffset(0, -20);
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.showText("Approval Date: " + formatDateTime(LocalDateTime.now()));

                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("DC Remarks: " + safeValue(application.getDcRemarks()));
                contentStream.endText();
            }

            document.save(outputStream);
            return outputStream.toByteArray();
        }
    } */

/*     private String safeValue(String value) {
        if (value == null || value.isBlank()) {
            return "N/A";
        }
        return value;
    } */

   /*  private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "N/A";
        }
        return dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    } */
}
