package nic.mn.pis.repository;

import nic.mn.pis.entity.PoliceStation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PoliceStationRepository extends JpaRepository<PoliceStation, Long> {
	List<PoliceStation> findBySubdivisionSubdivisionId(Long subdivisionId);
}
