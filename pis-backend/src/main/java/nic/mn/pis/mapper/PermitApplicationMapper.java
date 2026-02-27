package nic.mn.pis.mapper;

import nic.mn.pis.dto.PermitApplicationDto;
import nic.mn.pis.entity.PermitApplication;

public class PermitApplicationMapper {

    public static PermitApplicationDto mapToDto(PermitApplication app) {

        PermitApplicationDto dto = new PermitApplicationDto();
        dto.setApplicationId(app.getApplicationId());
        dto.setEventTitle(app.getEventTitle());
        dto.setPurpose(app.getPurpose());
        dto.setStartDateTime(app.getStartDateTime());
        dto.setEndDateTime(app.getEndDateTime());
        dto.setPermitType(app.getPermitType());
        dto.setLocationTag(app.getLocationTag());
        dto.setDocumentPath(app.getDocumentPath());
        dto.setDocumentFileName(app.getDocumentFileName());
        dto.setStatus(app.getStatus());
        dto.setCurrentStage(app.getCurrentStage());
        dto.setDcRemarks(app.getDcRemarks());
        dto.setSpRemarks(app.getSpRemarks());
        dto.setSdpoRemarks(app.getSdpoRemarks());
        dto.setOcReport(app.getOcReport());

        if (app.getUser() != null) {
            dto.setUserId(app.getUser().getUserId());
        }

        // Compute completeness for DC dashboard
        dto.setComplete(isComplete(app));

        return dto;
    }

    private static boolean isComplete(PermitApplication app) {
        if (app == null) return false;

        // Basic completeness criteria:
        // - event title present
        // - start and end date/time present
        // - document file name present (uploaded PDF)
        boolean hasTitle = app.getEventTitle() != null && !app.getEventTitle().trim().isEmpty();
        boolean hasDates = app.getStartDateTime() != null && app.getEndDateTime() != null;
        boolean hasDocument = app.getDocumentFileName() != null && !app.getDocumentFileName().trim().isEmpty();

        return hasTitle && hasDates && hasDocument;
    }

    public static PermitApplication mapToEntity(PermitApplicationDto dto) {

        PermitApplication app = new PermitApplication();
        app.setApplicationId(dto.getApplicationId());
        app.setEventTitle(dto.getEventTitle());
        app.setPurpose(dto.getPurpose());
        app.setStartDateTime(dto.getStartDateTime());
        app.setEndDateTime(dto.getEndDateTime());
        app.setPermitType(dto.getPermitType());
        app.setLocationTag(dto.getLocationTag());
        app.setDocumentPath(dto.getDocumentPath());
        app.setDocumentFileName(dto.getDocumentFileName());
        app.setStatus(dto.getStatus());
        app.setCurrentStage(dto.getCurrentStage());
        app.setDcRemarks(dto.getDcRemarks());
        app.setSpRemarks(dto.getSpRemarks());
        app.setSdpoRemarks(dto.getSdpoRemarks());
        app.setOcReport(dto.getOcReport());

        return app;
    }
}
