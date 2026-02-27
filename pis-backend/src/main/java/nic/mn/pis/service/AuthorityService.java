package nic.mn.pis.service;

import nic.mn.pis.dto.PermitApplicationDto;

import java.util.List;

/**
 * Service interface for handling authority workflow operations
 * Manages the progression of permit applications through different approval stages
 */
public interface AuthorityService {

    /**
     * Retrieve inbox applications at a specific workflow stage
     * @param stage the application stage (DC_PENDING, SP_PENDING, SDPO_PENDING, OC_PENDING, etc.)
     * @return list of applications at that stage
     */
    List<PermitApplicationDto> getInboxByStage(String stage);

    /**
     * Deputy Commissioner forwards application to State Police (SP)
     * Transitions from DC_PENDING to SP_PENDING
     * @param applicationId the application ID
     * @param dcRemarks remarks from deputy commissioner
     * @return updated application DTO
     */
    PermitApplicationDto forwardToSP(Long applicationId, String dcRemarks);

    /**
     * State Police forwards application to Sub-Divisional Police Officer (SDPO)
     * Transitions from SP_PENDING to SDPO_PENDING
     * @param applicationId the application ID
     * @param spRemarks remarks from state police
     * @return updated application DTO
     */
    PermitApplicationDto forwardToSDPO(Long applicationId, String spRemarks);

    /**
     * Sub-Divisional Police Officer forwards to Officer-in-Charge (OC)
     * Transitions from SDPO_PENDING to OC_PENDING
     * @param applicationId the application ID
     * @param sdpoRemarks remarks from SDPO
     * @return updated application DTO
     */
    PermitApplicationDto forwardToOC(Long applicationId, String sdpoRemarks);

    /**
     * Officer-in-Charge submits verification report
     * Transitions from OC_PENDING to SDPO_REVIEW_PENDING
     * @param applicationId the application ID
     * @param ocReport detailed investigation report from OC
     * @return updated application DTO
     */
    PermitApplicationDto submitOCReport(Long applicationId, String ocReport);

    /**
     * Sub-Divisional Police Officer forwards OC report back to State Police for review
     * Transitions from SDPO_REVIEW_PENDING to SP_REVIEW_PENDING
     * @param applicationId the application ID
     * @param sdpoRemarks additional remarks from SDPO
     * @return updated application DTO
     */
    PermitApplicationDto forwardToSPFromSDPO(Long applicationId, String sdpoRemarks);

    /**
     * State Police recommends application to Deputy Commissioner
     * Transitions from SP_REVIEW_PENDING to DC_FINAL_PENDING
     * @param applicationId the application ID
     * @param spRemarks recommendation from state police
     * @return updated application DTO
     */
    PermitApplicationDto recommendToDC(Long applicationId, String spRemarks);

    /**
     * Deputy Commissioner approves application and generates permit
     * Transitions from DC_FINAL_PENDING to COMPLETED with status APPROVED
     * @param applicationId the application ID
     * @param dcRemarks final remarks from deputy commissioner
     * @return updated application DTO with APPROVED status
     */
    PermitApplicationDto approveByDC(Long applicationId, String dcRemarks);

    /**
     * Deputy Commissioner rejects application
     * Transitions from DC_FINAL_PENDING to COMPLETED with status REJECTED
     * @param applicationId the application ID
     * @param dcRemarks rejection reason from deputy commissioner
     * @return updated application DTO with REJECTED status
     */
    PermitApplicationDto rejectByDC(Long applicationId, String dcRemarks);
}
