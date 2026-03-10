package nic.mn.pis.repository;

import nic.mn.pis.entity.Subdivision;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubdivisionRepository extends JpaRepository<Subdivision, Long> {
	List<Subdivision> findByDistrictDistrictId(Long districtId);
}
