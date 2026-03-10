package nic.mn.pis.service.impl;

import lombok.AllArgsConstructor;
import nic.mn.pis.dto.AuthorityActionHistoryDto;
import nic.mn.pis.dto.PermitApplicationDto;
import nic.mn.pis.entity.AuthorityActionHistory;
import nic.mn.pis.entity.PermitApplication;
import nic.mn.pis.exception.ResourceNotFoundException;
import nic.mn.pis.mapper.PermitApplicationMapper;
import nic.mn.pis.repository.AuthorityActionHistoryRepository;
import nic.mn.pis.repository.PermitApplicationRepository;
import nic.mn.pis.service.AuthorityService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of AuthorityService
 * Handles the complete workflow progression for permit applications
 */
@Service
@AllArgsConstructor
public class AuthorityServiceImpl implements AuthorityService {

    private static final String PERMIT_DIR = "uploads/permits";

    private PermitApplicationRepository permitApplicationRepository;
        private AuthorityActionHistoryRepository authorityActionHistoryRepository;

        @Override
        public List<AuthorityActionHistoryDto> getActionHistory(Long applicationId) {
        getApplication(applicationId);

        return authorityActionHistoryRepository
            .findByPermitApplication_ApplicationIdOrderByActionAtDesc(applicationId)
            .stream()
            .map(history -> new AuthorityActionHistoryDto(
                history.getHistoryId(),
                history.getAuthorityRole(),
                history.getActionType(),
                history.getMessage(),
                history.getPreviousStage(),
                history.getNewStage(),
                history.getPreviousStatus(),
                history.getNewStatus(),
                history.getActionAt()))
            .collect(Collectors.toList());
        }

    @Override
    public List<PermitApplicationDto> getInboxByStage(String stage, String roleId, Long userId) {
        List<PermitApplication> applications;

        if ("5".equals(roleId) && "OC_PENDING".equalsIgnoreCase(stage) && userId != null) {
            applications = permitApplicationRepository.findByCurrentStageAndAssignedOc_UserId(stage, userId);
        } else {
            applications = permitApplicationRepository.findByCurrentStage(stage);
        }

        return applications
                .stream()
                .map(PermitApplicationMapper::mapToDto)
                .collect(Collectors.toList());
    }

    private PermitApplication getApplication(Long id) {
        return permitApplicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + id));
    }

    /**
     * DC forwards to SP
     * Status: SUBMITTED → FORWARDED_TO_SP
     * Stage: DC_PENDING → SP_PENDING
     */
    @Override
    public PermitApplicationDto forwardToSP(Long applicationId, String dcRemarks) {
        PermitApplication app = getApplication(applicationId);
        String previousStage = app.getCurrentStage();
        String previousStatus = app.getStatus();

        app.setDcRemarks(dcRemarks);
        app.setCurrentStage("SP_PENDING");
        app.setStatus("FORWARDED_TO_SP");

        PermitApplication saved = permitApplicationRepository.save(app);
        saveHistory(saved, "DC", "FORWARDED_TO_SP", dcRemarks, previousStage, saved.getCurrentStage(), previousStatus, saved.getStatus());

        return PermitApplicationMapper.mapToDto(saved);
    }

    /**
     * SP forwards to SDPO
     * Status: FORWARDED_TO_SP → FORWARDED_TO_SDPO
     * Stage: SP_PENDING → SDPO_PENDING
     */
    @Override
    public PermitApplicationDto forwardToSDPO(Long applicationId, String spRemarks) {
        PermitApplication app = getApplication(applicationId);
        String previousStage = app.getCurrentStage();
        String previousStatus = app.getStatus();

        app.setSpRemarks(spRemarks);
        app.setCurrentStage("SDPO_PENDING");
        app.setStatus("FORWARDED_TO_SDPO");

        PermitApplication saved = permitApplicationRepository.save(app);
        saveHistory(saved, "SP", "FORWARDED_TO_SDPO", spRemarks, previousStage, saved.getCurrentStage(), previousStatus, saved.getStatus());

        return PermitApplicationMapper.mapToDto(saved);
    }

    /**
     * SDPO forwards to OC
     * Status: FORWARDED_TO_SDPO → FORWARDED_TO_OC
     * Stage: SDPO_PENDING → OC_PENDING
     */
    @Override
    public PermitApplicationDto forwardToOC(Long applicationId, String sdpoRemarks) {
        PermitApplication app = getApplication(applicationId);
        String previousStage = app.getCurrentStage();
        String previousStatus = app.getStatus();

        app.setSdpoRemarks(sdpoRemarks);
        app.setCurrentStage("OC_PENDING");
        app.setStatus("FORWARDED_TO_OC");

        PermitApplication saved = permitApplicationRepository.save(app);
        saveHistory(saved, "SDPO", "FORWARDED_TO_OC", sdpoRemarks, previousStage, saved.getCurrentStage(), previousStatus, saved.getStatus());

        return PermitApplicationMapper.mapToDto(saved);
    }

    /**
     * OC submits verification report
     * Status: FORWARDED_TO_OC → OC_VERIFIED
     * Stage: OC_PENDING → SDPO_REVIEW_PENDING
     */
    @Override
    public PermitApplicationDto submitOCReport(Long applicationId, String ocReport) {
        PermitApplication app = getApplication(applicationId);
        String previousStage = app.getCurrentStage();
        String previousStatus = app.getStatus();

        app.setOcReport(ocReport);
        app.setCurrentStage("SDPO_REVIEW_PENDING");
        app.setStatus("OC_VERIFIED");

        PermitApplication saved = permitApplicationRepository.save(app);
        saveHistory(saved, "OC", "OC_REPORT_SUBMITTED", ocReport, previousStage, saved.getCurrentStage(), previousStatus, saved.getStatus());

        return PermitApplicationMapper.mapToDto(saved);
    }

    /**
     * SDPO forwards OC report to SP for review
     * Status: OC_VERIFIED → SDPO_REVIEWED
     * Stage: SDPO_REVIEW_PENDING → SP_REVIEW_PENDING
     */
    @Override
    public PermitApplicationDto forwardToSPFromSDPO(Long applicationId, String sdpoRemarks) {
        PermitApplication app = getApplication(applicationId);
        String previousStage = app.getCurrentStage();
        String previousStatus = app.getStatus();

        app.setSdpoRemarks(sdpoRemarks);
        app.setCurrentStage("SP_REVIEW_PENDING");
        app.setStatus("SDPO_REVIEWED");

        PermitApplication saved = permitApplicationRepository.save(app);
        saveHistory(saved, "SDPO", "FORWARDED_TO_SP_REVIEW", sdpoRemarks, previousStage, saved.getCurrentStage(), previousStatus, saved.getStatus());

        return PermitApplicationMapper.mapToDto(saved);
    }

    /**
     * SP recommends to DC
     * Status: SDPO_REVIEWED → SP_RECOMMENDED
     * Stage: SP_REVIEW_PENDING → DC_FINAL_PENDING
     */
    @Override
    public PermitApplicationDto recommendToDC(Long applicationId, String spRemarks) {
        PermitApplication app = getApplication(applicationId);
        String previousStage = app.getCurrentStage();
        String previousStatus = app.getStatus();

        app.setSpRemarks(spRemarks);
        app.setCurrentStage("DC_FINAL_PENDING");
        app.setStatus("SP_RECOMMENDED");

        PermitApplication saved = permitApplicationRepository.save(app);
        saveHistory(saved, "SP", "RECOMMENDED_TO_DC", spRemarks, previousStage, saved.getCurrentStage(), previousStatus, saved.getStatus());

        return PermitApplicationMapper.mapToDto(saved);
    }

    /**
     * DC approves application
     * Status: SP_RECOMMENDED → APPROVED
     * Stage: DC_FINAL_PENDING → COMPLETED
     */
    @Override
    public PermitApplicationDto approveByDC(Long applicationId, String dcRemarks) {
        PermitApplication app = getApplication(applicationId);
        String previousStage = app.getCurrentStage();
        String previousStatus = app.getStatus();

        app.setDcRemarks(dcRemarks);
        app.setCurrentStage("COMPLETED");
        app.setStatus("APPROVED");

        try {
            generatePermitPdf(app);
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate permit PDF", e);
        }

        PermitApplication saved = permitApplicationRepository.save(app);
        saveHistory(saved, "DC", "APPROVED", dcRemarks, previousStage, saved.getCurrentStage(), previousStatus, saved.getStatus());

        return PermitApplicationMapper.mapToDto(saved);
    }

    /**
     * DC rejects application
     * Status: SP_RECOMMENDED → REJECTED
     * Stage: DC_FINAL_PENDING → COMPLETED
     */
    @Override
    public PermitApplicationDto rejectByDC(Long applicationId, String dcRemarks) {
        PermitApplication app = getApplication(applicationId);
        String previousStage = app.getCurrentStage();
        String previousStatus = app.getStatus();

        app.setDcRemarks(dcRemarks);
        app.setCurrentStage("COMPLETED");
        app.setStatus("REJECTED");

        PermitApplication saved = permitApplicationRepository.save(app);
        saveHistory(saved, "DC", "REJECTED", dcRemarks, previousStage, saved.getCurrentStage(), previousStatus, saved.getStatus());

        return PermitApplicationMapper.mapToDto(saved);
    }

    private void saveHistory(PermitApplication app,
                             String authorityRole,
                             String actionType,
                             String message,
                             String previousStage,
                             String newStage,
                             String previousStatus,
                             String newStatus) {
        AuthorityActionHistory history = new AuthorityActionHistory();
        history.setPermitApplication(app);
        history.setAuthorityRole(authorityRole);
        history.setActionType(actionType);
        history.setMessage(message);
        history.setPreviousStage(previousStage);
        history.setNewStage(newStage);
        history.setPreviousStatus(previousStatus);
        history.setNewStatus(newStatus);
        history.setActionAt(LocalDateTime.now());
        authorityActionHistoryRepository.save(history);
    }

    private void generatePermitPdf(PermitApplication app) throws IOException {
        Path permitDirectory = Paths.get(PERMIT_DIR);
        if (!Files.exists(permitDirectory)) {
            Files.createDirectories(permitDirectory);
        }

        String fileName = "permit_" + app.getApplicationId() + "_" + UUID.randomUUID() + ".pdf";
        Path filePath = permitDirectory.resolve(fileName);

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 18);
                contentStream.newLineAtOffset(60, 760);
                contentStream.showText("Permit Issuance Certificate");

                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.newLineAtOffset(0, -40);
                contentStream.showText("Permit Number: PIS-" + app.getApplicationId());

                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Event Title: " + safeValue(app.getEventTitle()));

                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Permit Type: " + safeValue(app.getPermitType()));

                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Location: " + safeValue(app.getFullAddress()));

                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Start Date/Time: " + formatDateTime(app.getStartDateTime()));

                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("End Date/Time: " + formatDateTime(app.getEndDateTime()));

                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("Applicant User ID: " + (app.getUser() != null ? app.getUser().getUserId() : "N/A"));

                contentStream.newLineAtOffset(0, -30);
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                contentStream.showText("Approved By: Deputy Commissioner");

                contentStream.newLineAtOffset(0, -20);
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.showText("Approval Date: " + formatDateTime(LocalDateTime.now()));

                contentStream.newLineAtOffset(0, -20);
                contentStream.showText("DC Remarks: " + safeValue(app.getDcRemarks()));
                contentStream.endText();
            }

            document.save(filePath.toFile());
        }

        app.setPermitPath(filePath.toString().replace("\\", "/"));
        app.setPermitFileName(fileName);
    }

    private String safeValue(String value) {
        if (value == null || value.isBlank()) {
            return "N/A";
        }
        return value;
    }

    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "N/A";
        }
        return dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
}
