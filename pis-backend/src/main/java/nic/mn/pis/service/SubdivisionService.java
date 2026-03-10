package nic.mn.pis.service;

import nic.mn.pis.entity.Subdivision;

import java.util.List;

public interface SubdivisionService {
    Subdivision createSubdivision(String subdivisionName, Long districtId);
    List<Subdivision> getSubdivisionsByDistrictId(Long districtId);
}
