package nic.mn.pis.repository;

import nic.mn.pis.entity.PermitApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PermitApplicationRepository extends JpaRepository<PermitApplication, Long> {

    List<PermitApplication> findByUser_UserId(Long userId);
    List<PermitApplication> findByCurrentStage(String stage);
    List<PermitApplication> findByStatus(String status);
    List<PermitApplication> findByCurrentStageAndPoliceStation_Subdivision_SubdivisionId(String stage, Long subdivisionId);
    List<PermitApplication> findByCurrentStageAndAssignedOc_UserId(String stage, Long userId);
    List<PermitApplication> findByStatusAndPoliceStation_Subdivision_SubdivisionId(String status, Long subdivisionId);
    List<PermitApplication> findByStatusAndPoliceStation_PoliceStationId(String status, Long policeStationId);
    List<PermitApplication> findByStatusAndAssignedOc_UserId(String status, Long userId);
    
    // New methods for jurisdiction-aware application retrieval (all applications, not filtered by status/stage)
    List<PermitApplication> findByPoliceStation_Subdivision_SubdivisionId(Long subdivisionId);
    List<PermitApplication> findByPoliceStation_PoliceStationId(Long policeStationId);
    List<PermitApplication> findByAssignedOc_UserId(Long userId);
}
