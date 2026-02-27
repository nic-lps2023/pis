package nic.mn.pis.service.impl;

import lombok.AllArgsConstructor;
import nic.mn.pis.dto.PermitApplicationDto;
import nic.mn.pis.entity.PermitApplication;
import nic.mn.pis.exception.ResourceNotFoundException;
import nic.mn.pis.mapper.PermitApplicationMapper;
import nic.mn.pis.repository.PermitApplicationRepository;
import nic.mn.pis.service.AuthorityService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of AuthorityService
 * Handles the complete workflow progression for permit applications
 */
@Service
@AllArgsConstructor
public class AuthorityServiceImpl implements AuthorityService {

    private PermitApplicationRepository permitApplicationRepository;

    @Override
    public List<PermitApplicationDto> getInboxByStage(String stage) {
        return permitApplicationRepository.findByCurrentStage(stage)
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

        app.setDcRemarks(dcRemarks);
        app.setCurrentStage("SP_PENDING");
        app.setStatus("FORWARDED_TO_SP");

        return PermitApplicationMapper.mapToDto(permitApplicationRepository.save(app));
    }

    /**
     * SP forwards to SDPO
     * Status: FORWARDED_TO_SP → FORWARDED_TO_SDPO
     * Stage: SP_PENDING → SDPO_PENDING
     */
    @Override
    public PermitApplicationDto forwardToSDPO(Long applicationId, String spRemarks) {
        PermitApplication app = getApplication(applicationId);

        app.setSpRemarks(spRemarks);
        app.setCurrentStage("SDPO_PENDING");
        app.setStatus("FORWARDED_TO_SDPO");

        return PermitApplicationMapper.mapToDto(permitApplicationRepository.save(app));
    }

    /**
     * SDPO forwards to OC
     * Status: FORWARDED_TO_SDPO → FORWARDED_TO_OC
     * Stage: SDPO_PENDING → OC_PENDING
     */
    @Override
    public PermitApplicationDto forwardToOC(Long applicationId, String sdpoRemarks) {
        PermitApplication app = getApplication(applicationId);

        app.setSdpoRemarks(sdpoRemarks);
        app.setCurrentStage("OC_PENDING");
        app.setStatus("FORWARDED_TO_OC");

        return PermitApplicationMapper.mapToDto(permitApplicationRepository.save(app));
    }

    /**
     * OC submits verification report
     * Status: FORWARDED_TO_OC → OC_VERIFIED
     * Stage: OC_PENDING → SDPO_REVIEW_PENDING
     */
    @Override
    public PermitApplicationDto submitOCReport(Long applicationId, String ocReport) {
        PermitApplication app = getApplication(applicationId);

        app.setOcReport(ocReport);
        app.setCurrentStage("SDPO_REVIEW_PENDING");
        app.setStatus("OC_VERIFIED");

        return PermitApplicationMapper.mapToDto(permitApplicationRepository.save(app));
    }

    /**
     * SDPO forwards OC report to SP for review
     * Status: OC_VERIFIED → SDPO_REVIEWED
     * Stage: SDPO_REVIEW_PENDING → SP_REVIEW_PENDING
     */
    @Override
    public PermitApplicationDto forwardToSPFromSDPO(Long applicationId, String sdpoRemarks) {
        PermitApplication app = getApplication(applicationId);

        app.setSdpoRemarks(sdpoRemarks);
        app.setCurrentStage("SP_REVIEW_PENDING");
        app.setStatus("SDPO_REVIEWED");

        return PermitApplicationMapper.mapToDto(permitApplicationRepository.save(app));
    }

    /**
     * SP recommends to DC
     * Status: SDPO_REVIEWED → SP_RECOMMENDED
     * Stage: SP_REVIEW_PENDING → DC_FINAL_PENDING
     */
    @Override
    public PermitApplicationDto recommendToDC(Long applicationId, String spRemarks) {
        PermitApplication app = getApplication(applicationId);

        app.setSpRemarks(spRemarks);
        app.setCurrentStage("DC_FINAL_PENDING");
        app.setStatus("SP_RECOMMENDED");

        return PermitApplicationMapper.mapToDto(permitApplicationRepository.save(app));
    }

    /**
     * DC approves application
     * Status: SP_RECOMMENDED → APPROVED
     * Stage: DC_FINAL_PENDING → COMPLETED
     */
    @Override
    public PermitApplicationDto approveByDC(Long applicationId, String dcRemarks) {
        PermitApplication app = getApplication(applicationId);

        app.setDcRemarks(dcRemarks);
        app.setCurrentStage("COMPLETED");
        app.setStatus("APPROVED");

        return PermitApplicationMapper.mapToDto(permitApplicationRepository.save(app));
    }

    /**
     * DC rejects application
     * Status: SP_RECOMMENDED → REJECTED
     * Stage: DC_FINAL_PENDING → COMPLETED
     */
    @Override
    public PermitApplicationDto rejectByDC(Long applicationId, String dcRemarks) {
        PermitApplication app = getApplication(applicationId);

        app.setDcRemarks(dcRemarks);
        app.setCurrentStage("COMPLETED");
        app.setStatus("REJECTED");

        return PermitApplicationMapper.mapToDto(permitApplicationRepository.save(app));
    }
}
