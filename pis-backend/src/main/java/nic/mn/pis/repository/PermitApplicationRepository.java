package nic.mn.pis.repository;

import nic.mn.pis.entity.PermitApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PermitApplicationRepository extends JpaRepository<PermitApplication, Long> {

    List<PermitApplication> findByUser_UserId(Long userId);
    List<PermitApplication> findByCurrentStage(String stage);
}
