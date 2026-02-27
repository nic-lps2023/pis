package nic.mn.pis.controller;

import lombok.AllArgsConstructor;
import nic.mn.pis.dto.AuthorityActionRequest;
import nic.mn.pis.dto.PermitApplicationDto;
import nic.mn.pis.service.AuthorityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Authority Controller
 * Handles API endpoints for permit application workflow progression
 * Supports DC, SP, SDPO, and OC operations
 */
@CrossOrigin("*")
@RestController
@AllArgsConstructor
@RequestMapping("/api/authority")
public class AuthorityController {

    private AuthorityService authorityService;

    /**
     * Get inbox applications for a specific workflow stage
     *
     * Supported stages:
     * - DC_PENDING: Applications awaiting Deputy Commissioner
     * - SP_PENDING: Applications awaiting State Police
     * - SDPO_PENDING: Applications awaiting Sub-Divisional Police Officer
     * - OC_PENDING: Applications awaiting Officer-in-Charge verification
     * - SDPO_REVIEW_PENDING: Applications in SDPO review after OC verification
     * - SP_REVIEW_PENDING: Applications in SP review (OC report submitted)
     * - DC_FINAL_PENDING: Applications awaiting final DC decision
     */
    @GetMapping("/inbox/{stage}")
    public ResponseEntity<List<PermitApplicationDto>> getInbox(
            @PathVariable String stage,
            @RequestHeader(value = "X-Role-Id", required = false) String roleId) {

        if ("4".equals(roleId) && !"SDPO_PENDING".equalsIgnoreCase(stage)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Role 4 (SDPO) is allowed to access only SDPO_PENDING stage");
        }

        return ResponseEntity.ok(authorityService.getInboxByStage(stage));
    }

    /**
     * Deputy Commissioner forwards application to State Police (SP)
     * Transitions: DC_PENDING → SP_PENDING, SUBMITTED → FORWARDED_TO_SP
     */
    @PutMapping("/dc/forward-sp/{id}")
    public ResponseEntity<PermitApplicationDto> forwardToSP(
            @PathVariable Long id,
            @RequestBody AuthorityActionRequest request) {
        return ResponseEntity.ok(authorityService.forwardToSP(id, request.getRemarks()));
    }

    /**
     * State Police forwards application to Sub-Divisional Police Officer (SDPO)
     * Transitions: SP_PENDING → SDPO_PENDING, FORWARDED_TO_SP → FORWARDED_TO_SDPO
     */
    @PutMapping("/sp/forward-sdpo/{id}")
    public ResponseEntity<PermitApplicationDto> forwardToSDPO(
            @PathVariable Long id,
            @RequestBody AuthorityActionRequest request) {
        return ResponseEntity.ok(authorityService.forwardToSDPO(id, request.getRemarks()));
    }

    /**
     * Sub-Divisional Police Officer forwards to Officer-in-Charge (OC)
     * Transitions: SDPO_PENDING → OC_PENDING, FORWARDED_TO_SDPO → FORWARDED_TO_OC
     */
    @PutMapping("/sdpo/forward-oc/{id}")
    public ResponseEntity<PermitApplicationDto> forwardToOC(
            @PathVariable Long id,
            @RequestBody AuthorityActionRequest request) {
        return ResponseEntity.ok(authorityService.forwardToOC(id, request.getRemarks()));
    }

    /**
     * Officer-in-Charge submits verification report
     * Transitions: OC_PENDING → SDPO_REVIEW_PENDING, FORWARDED_TO_OC → OC_VERIFIED
     */
    @PutMapping("/oc/report/{id}")
    public ResponseEntity<PermitApplicationDto> submitOCReport(
            @PathVariable Long id,
            @RequestBody AuthorityActionRequest request) {
        return ResponseEntity.ok(authorityService.submitOCReport(id, request.getReport()));
    }

    /**
     * Sub-Divisional Police Officer reviews OC report and forwards to State Police
     * Transitions: SDPO_REVIEW_PENDING → SP_REVIEW_PENDING, OC_VERIFIED → SDPO_REVIEWED
     */
    @PutMapping("/sdpo/forward-sp/{id}")
    public ResponseEntity<PermitApplicationDto> forwardToSPFromSDPO(
            @PathVariable Long id,
            @RequestBody AuthorityActionRequest request) {
        return ResponseEntity.ok(authorityService.forwardToSPFromSDPO(id, request.getRemarks()));
    }

    /**
     * State Police reviews all reports and recommends to Deputy Commissioner
     * Transitions: SP_REVIEW_PENDING → DC_FINAL_PENDING, SDPO_REVIEWED → SP_RECOMMENDED
     */
    @PutMapping("/sp/recommend-dc/{id}")
    public ResponseEntity<PermitApplicationDto> recommendToDC(
            @PathVariable Long id,
            @RequestBody AuthorityActionRequest request) {
        return ResponseEntity.ok(authorityService.recommendToDC(id, request.getRemarks()));
    }

    /**
     * Deputy Commissioner approves application and generates permit
     * Transitions: DC_FINAL_PENDING → COMPLETED, SP_RECOMMENDED → APPROVED
     */
    @PutMapping("/dc/approve/{id}")
    public ResponseEntity<PermitApplicationDto> approveByDC(
            @PathVariable Long id,
            @RequestBody AuthorityActionRequest request) {
        return ResponseEntity.ok(authorityService.approveByDC(id, request.getRemarks()));
    }

    /**
     * Deputy Commissioner rejects application
     * Transitions: DC_FINAL_PENDING → COMPLETED, SP_RECOMMENDED → REJECTED
     */
    @PutMapping("/dc/reject/{id}")
    public ResponseEntity<PermitApplicationDto> rejectByDC(
            @PathVariable Long id,
            @RequestBody AuthorityActionRequest request) {
        return ResponseEntity.ok(authorityService.rejectByDC(id, request.getRemarks()));
    }
}
