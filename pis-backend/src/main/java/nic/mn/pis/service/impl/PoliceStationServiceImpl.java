package nic.mn.pis.service.impl;

import lombok.AllArgsConstructor;
import nic.mn.pis.entity.PoliceStation;
import nic.mn.pis.entity.Subdivision;
import nic.mn.pis.exception.ResourceNotFoundException;
import nic.mn.pis.repository.PoliceStationRepository;
import nic.mn.pis.repository.SubdivisionRepository;
import nic.mn.pis.service.PoliceStationService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@AllArgsConstructor
public class PoliceStationServiceImpl implements PoliceStationService {

    private PoliceStationRepository policeStationRepository;
    private SubdivisionRepository subdivisionRepository;

    @Override
    public PoliceStation createPoliceStation(String policeStationName, Long subdivisionId) {
        if (policeStationName == null || policeStationName.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Police station name is required");
        }

        if (subdivisionId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subdivision id is required");
        }

        Subdivision subdivision = subdivisionRepository.findById(subdivisionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subdivision does not exist with id " + subdivisionId));

        PoliceStation policeStation = new PoliceStation();
        policeStation.setPoliceStationName(policeStationName.trim());
        policeStation.setSubdivision(subdivision);

        return policeStationRepository.save(policeStation);
    }

    @Override
    public List<PoliceStation> getPoliceStationsBySubdivisionId(Long subdivisionId) {
        if (subdivisionId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Subdivision id is required");
        }

        subdivisionRepository.findById(subdivisionId)
                .orElseThrow(() -> new ResourceNotFoundException("Subdivision does not exist with id " + subdivisionId));

        return policeStationRepository.findBySubdivisionSubdivisionId(subdivisionId);
    }
}
