package nic.mn.pis.service.impl;

import lombok.AllArgsConstructor;
import nic.mn.pis.entity.District;
import nic.mn.pis.entity.Subdivision;
import nic.mn.pis.exception.ResourceNotFoundException;
import nic.mn.pis.repository.DistrictRepository;
import nic.mn.pis.repository.SubdivisionRepository;
import nic.mn.pis.service.SubdivisionService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@AllArgsConstructor
public class SubdivisionServiceImpl implements SubdivisionService {

    private SubdivisionRepository subdivisionRepository;
    private DistrictRepository districtRepository;

    @Override
    public Subdivision createSubdivision(String subdivisionName, Long districtId) {
        if (subdivisionName == null || subdivisionName.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subdivision name is required");
        }

        if (districtId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "District id is required");
        }

        District district = districtRepository.findById(districtId)
                .orElseThrow(() -> new ResourceNotFoundException("District does not exist with id " + districtId));

        Subdivision subdivision = new Subdivision();
        subdivision.setSubdivisionName(subdivisionName.trim());
        subdivision.setDistrict(district);

        return subdivisionRepository.save(subdivision);
    }

    @Override
    public List<Subdivision> getSubdivisionsByDistrictId(Long districtId) {
        if (districtId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "District id is required");
        }

        districtRepository.findById(districtId)
                .orElseThrow(() -> new ResourceNotFoundException("District does not exist with id " + districtId));

        return subdivisionRepository.findByDistrictDistrictId(districtId);
    }
}
