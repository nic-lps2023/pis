package nic.mn.pis.service;

import nic.mn.pis.dto.AuthorityActionHistoryDto;
import nic.mn.pis.dto.PermitApplicationDto;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Service interface for handling authority workflow operations
 * Manages the progression of permit applications through different approval stages
 */
public interface AuthorityService {

    /**
     * Retrieve chronological action history for an application
     * @param applicationId permit application id
     * @return date-wise authority action history
     */
    List<AuthorityActionHistoryDto> getActionHistory(Long applicationId);

    /**
     * Retrieve inbox applications at a specific workflow stage
     * @param stage the application stage (DC_PENDING, SP_PENDING, SDPO_PENDING, OC_PENDING, etc.)
     * @return list of applications at that stage
     */
    List<PermitApplicationDto> getInboxByStage(String stage, String roleId, Long userId);

    /**
     * Retrieve completed outcome applications (APPROVED/REJECTED) filtered by authority jurisdiction.
     * SDPO users receive applications from their subdivision, OC users from their police station,
     * and other roles receive all applications for the requested status.
     *
     * @param status outcome status (APPROVED or REJECTED)
     * @param roleId authority role id from request header
     * @param userId logged in user id from request header
     * @return list of applications matching role-specific jurisdiction filter
     */
    List<PermitApplicationDto> getOutcomeApplicationsByStatus(String status, String roleId, Long userId);

    /**
     * Deputy Commissioner forwards application to State Police (SP)
     * Transitions from DC_PENDING to SP_PENDING
     * @param applicationId the application ID
     * @param dcRemarks remarks from deputy commissioner
     * @param dcUserId logged-in DC user ID (used to capture DC's full name)
     * @return updated application DTO
     */
    PermitApplicationDto forwardToSP(Long applicationId, String dcRemarks, Long dcUserId);

    /**
     * State Police forwards application to Sub-Divisional Police Officer (SDPO)
     * Transitions from SP_PENDING to SDPO_PENDING
     * @param applicationId the application ID
     * @param spRemarks remarks from state police
     * @param spUserId logged-in SP user ID (used to capture SP's full name)
     * @return updated application DTO
     */
    PermitApplicationDto forwardToSDPO(Long applicationId, String spRemarks, Long spUserId);

    /**
     * Sub-Divisional Police Officer forwards to Officer-in-Charge (OC)
     * Transitions from SDPO_PENDING to OC_PENDING
     * @param applicationId the application ID
     * @param sdpoRemarks remarks from SDPO
     * @param sdpoUserId logged-in SDPO user ID (used to capture SDPO's full name)
     * @return updated application DTO
     */
    PermitApplicationDto forwardToOC(Long applicationId, String sdpoRemarks, Long sdpoUserId);

    /**
     * Officer-in-Charge submits investigation: a short summary text plus an optional PDF attachment.
     * Transitions from OC_PENDING to SDPO_REVIEW_PENDING.
     * @param applicationId the application ID
     * @param ocSummary short summary of findings (stored in workflow/history)
     * @param pdfFile   optional full investigation report PDF (may be null)
     * @param ocUserId logged-in OC user ID (used to capture OC's full name)
     * @return updated application DTO
     */
    PermitApplicationDto submitOCReport(Long applicationId, String ocSummary, MultipartFile pdfFile, Long ocUserId) throws IOException;

    /**
     * Sub-Divisional Police Officer forwards OC report back to State Police for review
     * Transitions from SDPO_REVIEW_PENDING to SP_REVIEW_PENDING
     * @param applicationId the application ID
     * @param sdpoRemarks additional remarks from SDPO
     * @param sdpoUserId logged-in SDPO user ID (used to capture SDPO's full name)
     * @return updated application DTO
     */
    PermitApplicationDto forwardToSPFromSDPO(Long applicationId, String sdpoRemarks, Long sdpoUserId);

    /**
     * State Police recommends application to Deputy Commissioner
     * Transitions from SP_REVIEW_PENDING to DC_FINAL_PENDING
     * @param applicationId the application ID
     * @param spRemarks recommendation from state police
     * @param spUserId logged-in SP user ID (used to capture SP's full name)
     * @return updated application DTO
     */
    PermitApplicationDto recommendToDC(Long applicationId, String spRemarks, Long spUserId);

    /**
     * Deputy Commissioner approves application and generates permit
     * Transitions from DC_FINAL_PENDING to COMPLETED with status APPROVED
     * @param applicationId the application ID
     * @param dcRemarks final remarks from deputy commissioner
     * @param dcUserId logged-in DC user ID (used to capture DC's full name)
     * @return updated application DTO with APPROVED status
     */
    PermitApplicationDto approveByDC(Long applicationId, String dcRemarks, Long dcUserId);

    /**
     * Regenerate permit PDF for an already approved application.
     * @param applicationId the approved application ID
     * @return updated application DTO with refreshed permit path/name
     */
    PermitApplicationDto regeneratePermit(Long applicationId);

    /**
     * Deputy Commissioner rejects application
     * Transitions from DC_FINAL_PENDING to COMPLETED with status REJECTED
     * @param applicationId the application ID
     * @param dcRemarks rejection reason from deputy commissioner
     * @param dcUserId logged-in DC user ID (used to capture DC's full name)
     * @return updated application DTO with REJECTED status
     */
    PermitApplicationDto rejectByDC(Long applicationId, String dcRemarks, Long dcUserId);

    /**
     * Get all applications with role-based jurisdiction filtering
     * For SDPO: Returns applications from police stations in their subdivision
     * For OC: Returns applications from their police station
     * For DC/SP: Returns all applications
     *
     * @param roleId authority role id from request header
     * @param userId logged in user id from request header
     * @return list of applications matching role-specific jurisdiction filter
     */
    List<PermitApplicationDto> getAllApplicationsByJurisdiction(String roleId, Long userId);
}
