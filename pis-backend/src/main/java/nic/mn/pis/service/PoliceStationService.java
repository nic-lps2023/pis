package nic.mn.pis.service;

import nic.mn.pis.entity.PoliceStation;

import java.util.List;

public interface PoliceStationService {
    PoliceStation createPoliceStation(String policeStationName, Long subdivisionId);
    List<PoliceStation> getPoliceStationsBySubdivisionId(Long subdivisionId);
}
