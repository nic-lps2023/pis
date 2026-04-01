package nic.mn.pis.controller;

import lombok.AllArgsConstructor;
import nic.mn.pis.dto.AuthorityActionHistoryDto;
import nic.mn.pis.dto.AuthorityActionRequest;
import nic.mn.pis.dto.PermitApplicationDto;
import nic.mn.pis.service.AuthorityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;
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

    @GetMapping("/history/{id}")
    public ResponseEntity<List<AuthorityActionHistoryDto>> getActionHistory(@PathVariable Long id) {
        return ResponseEntity.ok(authorityService.getActionHistory(id));
    }

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
            @RequestHeader(value = "X-Role-Id", required = false) String roleId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {

        if ("4".equals(roleId)
                && !"SDPO_PENDING".equalsIgnoreCase(stage)
                && !"SDPO_REVIEW_PENDING".equalsIgnoreCase(stage)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Role 4 (SDPO) is allowed to access only SDPO_PENDING and SDPO_REVIEW_PENDING stages");
        }

        return ResponseEntity.ok(authorityService.getInboxByStage(stage, roleId, userId));
    }

    /**
     * Get completed applications by final status with role-based jurisdiction filtering.
        * Supported statuses: APPROVED, REJECTED, OC_VERIFIED.
     */
    @GetMapping("/applications/status/{status}")
    public ResponseEntity<List<PermitApplicationDto>> getApplicationsByStatus(
            @PathVariable String status,
            @RequestHeader(value = "X-Role-Id", required = false) String roleId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {

        String normalizedStatus = status == null ? "" : status.trim().toUpperCase();
        if (!"APPROVED".equals(normalizedStatus)
            && !"REJECTED".equals(normalizedStatus)
            && !"OC_VERIFIED".equals(normalizedStatus)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                "Only APPROVED, REJECTED and OC_VERIFIED statuses are supported");
        }

        return ResponseEntity.ok(authorityService.getOutcomeApplicationsByStatus(normalizedStatus, roleId, userId));
    }

    /**
     * Get all applications with role-based jurisdiction filtering
     * For SDPO: Returns applications from police stations in their subdivision
     * For OC: Returns applications from their police station
     * For others: Returns all applications
     */
    @GetMapping("/sdpo/all-applications")
    public ResponseEntity<List<PermitApplicationDto>> getAllApplicationsByJurisdiction(
            @RequestHeader(value = "X-Role-Id", required = false) String roleId,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(authorityService.getAllApplicationsByJurisdiction(roleId, userId));
    }

    /**
     * Deputy Commissioner forwards application to State Police (SP)
     * Transitions: DC_PENDING → SP_PENDING, SUBMITTED → FORWARDED_TO_SP
     */
    @PutMapping("/dc/forward-sp/{id}")
    public ResponseEntity<PermitApplicationDto> forwardToSP(
            @PathVariable Long id,
            @RequestBody AuthorityActionRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(authorityService.forwardToSP(id, request.getRemarks(), userId));
    }

    /**
     * State Police forwards application to Sub-Divisional Police Officer (SDPO)
     * Transitions: SP_PENDING → SDPO_PENDING, FORWARDED_TO_SP → FORWARDED_TO_SDPO
     */
    @PutMapping("/sp/forward-sdpo/{id}")
    public ResponseEntity<PermitApplicationDto> forwardToSDPO(
            @PathVariable Long id,
            @RequestBody AuthorityActionRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(authorityService.forwardToSDPO(id, request.getRemarks(), userId));
    }

    /**
     * Sub-Divisional Police Officer forwards to Officer-in-Charge (OC)
     * Transitions: SDPO_PENDING → OC_PENDING, FORWARDED_TO_SDPO → FORWARDED_TO_OC
     */
    @PutMapping("/sdpo/forward-oc/{id}")
    public ResponseEntity<PermitApplicationDto> forwardToOC(
            @PathVariable Long id,
            @RequestBody AuthorityActionRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(authorityService.forwardToOC(id, request.getRemarks(), userId));
    }

    /**
     * Officer-in-Charge submits investigation: short summary text + optional PDF attachment.
     * Accepts multipart/form-data with:
     *   - summary (required): short text summary of findings
     *   - pdfFile (optional): full investigation report PDF
     * Transitions: OC_PENDING → SDPO_REVIEW_PENDING, FORWARDED_TO_OC → OC_VERIFIED
     */
    @PostMapping(value = "/oc/report/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<PermitApplicationDto> submitOCReport(
            @PathVariable Long id,
            @RequestParam("summary") String summary,
            @RequestParam(value = "pdfFile", required = false) MultipartFile pdfFile,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        try {
            return ResponseEntity.ok(authorityService.submitOCReport(id, summary, pdfFile, userId));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to submit OC report: " + e.getMessage());
        }
    }

    /**
     * Sub-Divisional Police Officer reviews OC report and forwards to State Police
     * Transitions: SDPO_REVIEW_PENDING → SP_REVIEW_PENDING, OC_VERIFIED → SDPO_REVIEWED
     */
    @PutMapping("/sdpo/forward-sp/{id}")
    public ResponseEntity<PermitApplicationDto> forwardToSPFromSDPO(
            @PathVariable Long id,
            @RequestBody AuthorityActionRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(authorityService.forwardToSPFromSDPO(id, request.getRemarks(), userId));
    }

    /**
     * State Police reviews all reports and recommends to Deputy Commissioner
     * Transitions: SP_REVIEW_PENDING → DC_FINAL_PENDING, SDPO_REVIEWED → SP_RECOMMENDED
     */
    @PutMapping("/sp/recommend-dc/{id}")
    public ResponseEntity<PermitApplicationDto> recommendToDC(
            @PathVariable Long id,
            @RequestBody AuthorityActionRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(authorityService.recommendToDC(id, request.getRemarks(), userId));
    }

    /**
     * Deputy Commissioner approves application and generates permit
     * Transitions: DC_FINAL_PENDING → COMPLETED, SP_RECOMMENDED → APPROVED
     */
    @PutMapping("/dc/approve/{id}")
    public ResponseEntity<PermitApplicationDto> approveByDC(
            @PathVariable Long id,
            @RequestBody AuthorityActionRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(authorityService.approveByDC(id, request.getRemarks(), userId));
    }

    /**
     * Deputy Commissioner rejects application
     * Transitions: DC_FINAL_PENDING → COMPLETED, SP_RECOMMENDED → REJECTED
     */
    @PutMapping("/dc/reject/{id}")
    public ResponseEntity<PermitApplicationDto> rejectByDC(
            @PathVariable Long id,
            @RequestBody AuthorityActionRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long userId) {
        return ResponseEntity.ok(authorityService.rejectByDC(id, request.getRemarks(), userId));
    }
}
