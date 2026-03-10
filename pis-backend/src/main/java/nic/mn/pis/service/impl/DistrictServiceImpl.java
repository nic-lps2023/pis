package nic.mn.pis.service.impl;

import lombok.AllArgsConstructor;
import nic.mn.pis.entity.District;
import nic.mn.pis.repository.DistrictRepository;
import nic.mn.pis.service.DistrictService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@AllArgsConstructor
public class DistrictServiceImpl implements DistrictService {

    private DistrictRepository districtRepository;

    @Override
    public District createDistrict(String districtName) {
        if (districtName == null || districtName.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "District name is required");
        }

        District district = new District();
        district.setDistrictName(districtName.trim());

        return districtRepository.save(district);
    }

    @Override
    public List<District> getAllDistricts() {
        return districtRepository.findAll();
    }
}
