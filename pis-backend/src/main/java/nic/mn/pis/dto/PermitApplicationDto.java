package nic.mn.pis.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for Permit Application
 * Represents a permit application in the workflow
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PermitApplicationDto {

    private Long applicationId;
    private String eventTitle;
    private String purpose;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;
    private String permitType;
    private String locationTag;

    private String documentPath;
    private String documentFileName;

    /**
     * Current status in the approval workflow
     * SUBMITTED, FORWARDED_TO_SP, FORWARDED_TO_SDPO, FORWARDED_TO_OC, OC_VERIFIED,
     * SDPO_REVIEWED, SP_RECOMMENDED, APPROVED, REJECTED
     */
    private String status;

    /**
     * Current stage indicating which authority/role should process it
     * DC_PENDING, SP_PENDING, SDPO_PENDING, OC_PENDING, SDPO_REVIEW_PENDING,
     * SP_REVIEW_PENDING, DC_FINAL_PENDING, COMPLETED
     */
    private String currentStage;

    // REMARKS AND REPORTS FROM DIFFERENT AUTHORITIES

    /**
     * Remarks provided by Deputy Commissioner (DC)
     */
    private String dcRemarks;

    /**
     * Remarks provided by State Police (SP)
     */
    private String spRemarks;

    /**
     * Remarks provided by Sub-Divisional Police Officer (SDPO)
     */
    private String sdpoRemarks;

    /**
     * Detailed investigation report from Officer-in-Charge (OC)
     */
    private String ocReport;

    /**
     * User ID of the applicant who submitted the application
     */
    private Long userId;

    /**
     * Flag indicating if application has all required information
     * (used by DC dashboard to identify complete vs incomplete applications)
     */
    private boolean complete;
}
