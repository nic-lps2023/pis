package nic.mn.pis.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Permit Application Entity
 * Represents a permit application progressing through the approval workflow
 *
 * Application Status Flow:
 * SUBMITTED → FORWARDED_TO_SP → FORWARDED_TO_SDPO → FORWARDED_TO_OC → OC_VERIFIED →
 * SDPO_REVIEWED → SP_RECOMMENDED → APPROVED/REJECTED
 *
 * Stage Flow for Role Assignment:
 * DC_PENDING → SP_PENDING → SDPO_PENDING → OC_PENDING → SDPO_REVIEW_PENDING →
 * SP_REVIEW_PENDING → DC_FINAL_PENDING → COMPLETED
 */
@Entity
@Table(name = "permit_applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PermitApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long applicationId;

    @Column(nullable = false)
    private String eventTitle;

    @Column(nullable = false, length = 2000)
    private String purpose;

    @Column(nullable = false)
    private LocalDateTime startDateTime;

    @Column(nullable = false)
    private LocalDateTime endDateTime;

    @Column(nullable = false)
    private String permitType;

    @Column(nullable = false)
    private String locationTag;

    @Column(nullable = true)
    private String documentPath;

    @Column(nullable = true)
    private String documentFileName;

    /**
     * Main status representing the application state in the workflow:
     * SUBMITTED, FORWARDED_TO_SP, FORWARDED_TO_SDPO, FORWARDED_TO_OC, OC_VERIFIED,
     * SDPO_REVIEWED, SP_RECOMMENDED, APPROVED, REJECTED
     */
    @Column(nullable = false)
    private String status = "SUBMITTED";

    /**
     * Current stage representing which role should process the application:
     * DC_PENDING, SP_PENDING, SDPO_PENDING, OC_PENDING, SDPO_REVIEW_PENDING,
     * SP_REVIEW_PENDING, DC_FINAL_PENDING, COMPLETED
     */
    @Column(nullable = false)
    private String currentStage = "DC_PENDING";

    // REMARKS AND REPORTS FROM DIFFERENT AUTHORITIES

    /**
     * Remarks from Deputy Commissioner (DC)
     */
    @Column(length = 2000)
    private String dcRemarks;

    /**
     * Remarks from State Police (SP)
     */
    @Column(length = 2000)
    private String spRemarks;

    /**
     * Remarks from Sub-Divisional Police Officer (SDPO)
     */
    @Column(length = 2000)
    private String sdpoRemarks;

    /**
     * Detailed investigation report from Officer-in-Charge (OC)
     */
    @Column(length = 4000)
    private String ocReport;

    /**
     * Reference to the applicant (user who submitted the application)
     */
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
