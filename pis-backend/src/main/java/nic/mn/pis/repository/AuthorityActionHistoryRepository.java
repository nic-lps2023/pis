package nic.mn.pis.repository;

import nic.mn.pis.entity.AuthorityActionHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuthorityActionHistoryRepository extends JpaRepository<AuthorityActionHistory, Long> {
    List<AuthorityActionHistory> findByPermitApplication_ApplicationIdOrderByActionAtDesc(Long applicationId);
}
