package nic.mn.pis.service;

import nic.mn.pis.entity.District;

import java.util.List;

public interface DistrictService {
    District createDistrict(String districtName);
    List<District> getAllDistricts();
}
