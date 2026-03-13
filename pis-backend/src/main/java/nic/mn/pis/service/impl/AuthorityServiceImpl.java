package nic.mn.pis.service.impl;

import lombok.AllArgsConstructor;
import nic.mn.pis.dto.AuthorityActionHistoryDto;
import nic.mn.pis.dto.PermitApplicationDto;
import nic.mn.pis.entity.AuthorityActionHistory;
import nic.mn.pis.entity.PermitApplication;
import nic.mn.pis.entity.User;
import nic.mn.pis.exception.ResourceNotFoundException;
import nic.mn.pis.mapper.PermitApplicationMapper;
import nic.mn.pis.repository.AuthorityActionHistoryRepository;
import nic.mn.pis.repository.PermitApplicationRepository;
import nic.mn.pis.repository.UserRepository;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
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
    private static final Long DC_ROLE_ID = 2L;

    private PermitApplicationRepository permitApplicationRepository;
    private AuthorityActionHistoryRepository authorityActionHistoryRepository;
    private UserRepository userRepository;

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

        if ("4".equals(roleId)
                && ("SDPO_PENDING".equalsIgnoreCase(stage) || "SDPO_REVIEW_PENDING".equalsIgnoreCase(stage))) {
            if (userId == null) {
                return Collections.emptyList();
            }

            User sdpoUser = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

            if (sdpoUser.getSubdivision() == null || sdpoUser.getSubdivision().getSubdivisionId() == null) {
                return Collections.emptyList();
            }

            applications = permitApplicationRepository
                    .findByCurrentStageAndPoliceStation_Subdivision_SubdivisionId(
                            stage,
                            sdpoUser.getSubdivision().getSubdivisionId());
        } else if ("5".equals(roleId) && "OC_PENDING".equalsIgnoreCase(stage) && userId != null) {
            applications = permitApplicationRepository.findByCurrentStageAndAssignedOc_UserId(stage, userId);
        } else {
            applications = permitApplicationRepository.findByCurrentStage(stage);
        }

        return applications
                .stream()
                .map(PermitApplicationMapper::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<PermitApplicationDto> getOutcomeApplicationsByStatus(String status, String roleId, Long userId) {
        List<PermitApplication> applications;

        if ("4".equals(roleId)) {
            if (userId == null) {
                return Collections.emptyList();
            }

            User sdpoUser = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

            if (sdpoUser.getSubdivision() == null || sdpoUser.getSubdivision().getSubdivisionId() == null) {
                return Collections.emptyList();
            }

            applications = permitApplicationRepository.findByStatusAndPoliceStation_Subdivision_SubdivisionId(
                    status,
                    sdpoUser.getSubdivision().getSubdivisionId());
        } else if ("5".equals(roleId)) {
            if (userId == null) {
                return Collections.emptyList();
            }

            User ocUser = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

            if (ocUser.getPoliceStation() != null && ocUser.getPoliceStation().getPoliceStationId() != null) {
                applications = permitApplicationRepository.findByStatusAndPoliceStation_PoliceStationId(
                        status,
                        ocUser.getPoliceStation().getPoliceStationId());
            } else {
                applications = permitApplicationRepository.findByStatusAndAssignedOc_UserId(status, userId);
            }
        } else {
            applications = permitApplicationRepository.findByStatus(status);
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

        if (app.getAssignedOc() == null) {
            throw new ResourceNotFoundException(
                "No OC is mapped to this application's police station. Please assign an OC for this jurisdiction first.");
        }

        if (app.getPoliceStation() == null
            || app.getAssignedOc().getPoliceStation() == null
            || app.getPoliceStation().getPoliceStationId() == null
            || app.getAssignedOc().getPoliceStation().getPoliceStationId() == null
            || !app.getPoliceStation().getPoliceStationId()
                .equals(app.getAssignedOc().getPoliceStation().getPoliceStationId())) {
            throw new ResourceNotFoundException(
                "Assigned OC is outside the application's police station jurisdiction. Please correct OC mapping and retry.");
        }

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

    @Override
    public PermitApplicationDto regeneratePermit(Long applicationId) {
        PermitApplication app = getApplication(applicationId);

        if (!"APPROVED".equalsIgnoreCase(app.getStatus())) {
            throw new ResourceNotFoundException("Permit can be regenerated only for approved applications");
        }

        try {
            generatePermitPdf(app);
        } catch (IOException e) {
            throw new RuntimeException("Failed to regenerate permit PDF", e);
        }

        PermitApplication saved = permitApplicationRepository.save(app);
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

        String districtName = getDistrictName(app);
        String placeName = "N/A".equals(districtName) ? "Thoubal" : districtName;
        LocalDateTime now = LocalDateTime.now();
        String readableCurrentDate = formatReadableDate(now);
        String approvedDate = formatReadableDate(now);
        String permitNumberLabel = "Permit No.";
        String permitNumberValue = String.format("%04d", app.getApplicationId()) + "/" + LocalDate.now().getYear();
        String applicantName = app.getUser() != null ? safeValue(app.getUser().getFullName()) : "N/A";
        String applicantAddress = app.getUser() != null ? safeValue(app.getUser().getAddress()) : "N/A";
        String dcFullName = userRepository.findFirstByRole_RoleIdAndIsActiveTrue(DC_ROLE_ID)
            .map(User::getFullName)
            .filter(name -> name != null && !name.isBlank())
            .orElse("Deputy Commissioner");

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
            float pageWidth = page.getMediaBox().getWidth();
            float leftMargin = 50f;
            float rightMargin = 50f;
            float availableWidth = pageWidth - leftMargin - rightMargin;
            float y = 790f;

            PDType1Font bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font mono = new PDType1Font(Standard14Fonts.FontName.COURIER);

            y = writeCenteredLine(contentStream, "GOVERNMENT OF MANIPUR".toUpperCase(), bold, 13f, y, pageWidth);
            y = writeCenteredLine(contentStream, ("OFFICE OF THE DISTRICT MAGISTRATE, " + districtName).toUpperCase(), bold, 11f, y, pageWidth);

            y -= 12f;
            y = writeCenteredLine(contentStream, "PERMIT", bold, 14f, y, pageWidth);
            y = writeCenteredLine(contentStream, placeName + ", the " + readableCurrentDate, regular, 11f, y, pageWidth);

            y -= 10f;
            String subjectLead = " : Subject to the fulfillment of the following terms and conditions, "
                + applicantName + ", " + applicantAddress
                + " is hereby permitted for organizing a " + safeValue(app.getPurpose())
                + " on date, time and schedule mentioned below:";
            String permitPrefix = permitNumberLabel + " " + permitNumberValue;
            y = writeMixedPrefixWrappedText(
                contentStream,
                permitPrefix,
                bold,
                subjectLead,
                regular,
                10.5f,
                leftMargin,
                y,
                availableWidth,
                14f
            );

            y -= 4f;
            y = writeWrappedText(contentStream,
                "1) The volume of PA/Speaker system should not exceed 10dB(A) above the ambient noise of the public area or 65dB(A), whichever is lower.",
                regular, 10f, leftMargin, y, availableWidth, 14f);
            y = writeWrappedText(contentStream,
                "2) The organizer should assure that there could not be any slogan inciting communal tension/disturbing public order and peace.",
                regular, 10f, leftMargin, y, availableWidth, 14f);
            y = writeWrappedText(contentStream,
                "3) The organizer should assure that the event area should not be used for vending alcohol or any other contraband.",
                regular, 10f, leftMargin, y, availableWidth, 14f);
            y = writeWrappedText(contentStream,
                "4) The organizer should assure vehicle parking should be maintained systematically at the place of function and it should not disturb normal vehicular movement.",
                regular, 10f, leftMargin, y, availableWidth, 14f);
            y = writeWrappedText(contentStream,
                "5) The organizer should assure the programme schedule should comply with time to time existing prohibitory order of the District Magistrate, " + districtName + ".",
                regular, 10f, leftMargin, y, availableWidth, 14f);
            y = writeWrappedText(contentStream,
                "6) The organizer should strictly co-operate with Law and Order Authority if need arises.",
                regular, 10f, leftMargin, y, availableWidth, 14f);
            y = writeWrappedText(contentStream,
                "7) In case of any violation of the stipulated conditions and Law and Order issues arising out of the said programme, the organizer shall be made legally liable.",
                regular, 10f, leftMargin, y, availableWidth, 14f);

            y -= 4f;
            contentStream.setNonStrokingColor(0, 0, 0);
            y = writeText(contentStream, "Recommended Scheduled:", bold, 10.5f, leftMargin, y);

            final int venueColWidth = 40;
            final int dateTimeColWidth = 40;
            final float scheduleFontSize = 9.2f;
            String border = "+" + "-".repeat(venueColWidth + 2) + "+" + "-".repeat(dateTimeColWidth + 2) + "+";
            String separator = border;
            String header = "| " + padRight("Venue", venueColWidth) + " | " + padRight("Date and Time", dateTimeColWidth) + " |";
            String row1 = "| " + padRight(safeValue(app.getVenueName()), venueColWidth)
                + " | " + padRight("Start: " + formatPermitDateTime(app.getStartDateTime()), dateTimeColWidth) + " |";
            
            String row2 = "| " + padRight(safeValue(app.getFullAddress()), venueColWidth)
                + " | " + padRight("End: " + formatPermitDateTime(app.getEndDateTime()), dateTimeColWidth) + " |";
            
            String row3 = "| " + padRight(safeValue(app.getLocality()), venueColWidth)
                + " | " + padRight("", dateTimeColWidth) + " |";

            y = writeText(contentStream, border, mono, scheduleFontSize, leftMargin, y);
            y = writeText(contentStream, header, mono, scheduleFontSize, leftMargin, y);
            y = writeText(contentStream, separator, mono, scheduleFontSize, leftMargin, y);
            y = writeText(contentStream, row1, mono, scheduleFontSize, leftMargin, y);
            y = writeText(contentStream, row2, mono, scheduleFontSize, leftMargin, y);
            y = writeText(contentStream, row3, mono, scheduleFontSize, leftMargin, y);
            y = writeText(contentStream, border, mono, scheduleFontSize, leftMargin, y);

            y -= 6f;
            y = writeWrappedText(contentStream,
                "This permit is given with reference to the verification report submitted online by Superintendent of Police, "
                    + districtName + ".",
                regular, 10f, leftMargin, y, availableWidth, 14f);

            y -= 14f;
            y = writeText(contentStream, "Approved Date: " + approvedDate, regular, 10f, leftMargin, y);

            float rightX = pageWidth - rightMargin - 190f;
            writeSingleLine(contentStream, safeValue(dcFullName) + ", IAS", regular, 10.5f, rightX, y + 14f);
            writeSingleLine(contentStream, "District Magistrate / DC, " + districtName, regular, 10.5f, rightX, y);
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

    private String getDistrictName(PermitApplication app) {
        if (app.getPoliceStation() == null
                || app.getPoliceStation().getSubdivision() == null
                || app.getPoliceStation().getSubdivision().getDistrict() == null
                || app.getPoliceStation().getSubdivision().getDistrict().getDistrictName() == null
                || app.getPoliceStation().getSubdivision().getDistrict().getDistrictName().isBlank()) {
            return "Thoubal";
        }
        return app.getPoliceStation().getSubdivision().getDistrict().getDistrictName();
    }

    private String formatReadableDate(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "N/A";
        }
        int day = dateTime.getDayOfMonth();
        String suffix = getDaySuffix(day);
        String monthYear = dateTime.format(DateTimeFormatter.ofPattern("MMMM, yyyy"));
        return day + suffix + " " + monthYear;
    }

    private String getDaySuffix(int day) {
        if (day >= 11 && day <= 13) {
            return "th";
        }

        return switch (day % 10) {
            case 1 -> "st";
            case 2 -> "nd";
            case 3 -> "rd";
            default -> "th";
        };
    }

    private String formatPermitDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "N/A";
        }
        return dateTime.format(DateTimeFormatter.ofPattern("dd-MM-yyyy hh:mm a"));
    }

    private float writeCenteredLine(PDPageContentStream contentStream,
                                    String text,
                                    PDType1Font font,
                                    float fontSize,
                                    float y,
                                    float pageWidth) throws IOException {
        String safeText = sanitizePdfText(text);
        float textWidth = font.getStringWidth(safeText) / 1000f * fontSize;
        float x = (pageWidth - textWidth) / 2f;
        writeSingleLine(contentStream, safeText, font, fontSize, x, y);
        return y - (fontSize + 5f);
    }

    private float writeText(PDPageContentStream contentStream,
                            String text,
                            PDType1Font font,
                            float fontSize,
                            float x,
                            float y) throws IOException {
        writeSingleLine(contentStream, sanitizePdfText(text), font, fontSize, x, y);
        return y - (fontSize + 3f);
    }

    private float writeWrappedText(PDPageContentStream contentStream,
                                   String text,
                                   PDType1Font font,
                                   float fontSize,
                                   float x,
                                   float y,
                                   float maxWidth,
                                   float leading) throws IOException {
        String[] words = sanitizePdfText(text).split("\\s+");
        StringBuilder line = new StringBuilder();

        for (String word : words) {
            String candidate = line.isEmpty() ? word : line + " " + word;
            float candidateWidth = font.getStringWidth(candidate) / 1000f * fontSize;

            if (candidateWidth > maxWidth && !line.isEmpty()) {
                writeSingleLine(contentStream, line.toString(), font, fontSize, x, y);
                y -= leading;
                line = new StringBuilder(word);
            } else {
                line = new StringBuilder(candidate);
            }
        }

        if (!line.isEmpty()) {
            writeSingleLine(contentStream, line.toString(), font, fontSize, x, y);
            y -= leading;
        }

        return y;
    }

    private float writeMixedPrefixWrappedText(PDPageContentStream contentStream,
                                              String boldPrefix,
                                              PDType1Font boldFont,
                                              String normalText,
                                              PDType1Font normalFont,
                                              float fontSize,
                                              float x,
                                              float y,
                                              float maxWidth,
                                              float leading) throws IOException {
        String safePrefix = sanitizePdfText(boldPrefix == null ? "" : boldPrefix);
        String safeNormal = sanitizePdfText(normalText == null ? "" : normalText);

        writeSingleLine(contentStream, safePrefix, boldFont, fontSize, x, y);
        float prefixWidth = boldFont.getStringWidth(safePrefix) / 1000f * fontSize;

        String firstLineCandidate = safePrefix + safeNormal;
        float firstLineWidth = normalFont.getStringWidth(firstLineCandidate) / 1000f * fontSize;

        if (firstLineWidth <= maxWidth) {
            writeSingleLine(contentStream, safeNormal, normalFont, fontSize, x + prefixWidth, y);
            return y - leading;
        }

        float remainingWidth = maxWidth - prefixWidth;
        if (remainingWidth < 60f) {
            y -= leading;
            return writeWrappedText(contentStream, safeNormal, normalFont, fontSize, x, y, maxWidth, leading);
        }

        String[] words = safeNormal.split("\\s+");
        StringBuilder firstLineNormal = new StringBuilder();
        int usedWords = 0;

        for (String word : words) {
            String candidate = firstLineNormal.isEmpty() ? word : firstLineNormal + " " + word;
            float candidateWidth = normalFont.getStringWidth(candidate) / 1000f * fontSize;
            if (candidateWidth > remainingWidth && !firstLineNormal.isEmpty()) {
                break;
            }
            firstLineNormal = new StringBuilder(candidate);
            usedWords++;
        }

        if (!firstLineNormal.isEmpty()) {
            writeSingleLine(contentStream, firstLineNormal.toString(), normalFont, fontSize, x + prefixWidth, y);
        }

        y -= leading;

        if (usedWords >= words.length) {
            return y;
        }

        String remaining = String.join(" ", java.util.Arrays.copyOfRange(words, usedWords, words.length));
        return writeWrappedText(contentStream, remaining, normalFont, fontSize, x, y, maxWidth, leading);
    }

    private void writeSingleLine(PDPageContentStream contentStream,
                                 String text,
                                 PDType1Font font,
                                 float fontSize,
                                 float x,
                                 float y) throws IOException {
        contentStream.beginText();
        contentStream.setFont(font, fontSize);
        contentStream.newLineAtOffset(x, y);
        contentStream.showText(sanitizePdfText(text));
        contentStream.endText();
    }

    private String padRight(String value, int width) {
        String safe = sanitizePdfText(value == null ? "" : value);
        if (safe.length() > width) {
            return safe.substring(0, width);
        }
        return safe + " ".repeat(width - safe.length());
    }

    private String sanitizePdfText(String text) {
        if (text == null) {
            return "";
        }
        return text
                .replace("\n", " ")
                .replace("\r", " ")
                .replace("\t", " ")
                .replace("\u200B", "")
                .replace("\u00A0", " ");
    }
}
