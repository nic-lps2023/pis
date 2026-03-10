package nic.mn.pis.controller;

import lombok.AllArgsConstructor;
import nic.mn.pis.dto.PoliceStationRequest;
import nic.mn.pis.dto.PoliceStationResponse;
import nic.mn.pis.entity.PoliceStation;
import nic.mn.pis.service.PoliceStationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin("*")
@AllArgsConstructor
@RestController
@RequestMapping("/api/police-stations")
public class PoliceStationController {

    private PoliceStationService policeStationService;

    @PostMapping
    public ResponseEntity<PoliceStation> createPoliceStation(@RequestBody PoliceStationRequest request) {
        PoliceStation policeStation = policeStationService.createPoliceStation(request.getPoliceStationName(), request.getSubdivisionId());
        return new ResponseEntity<>(policeStation, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<PoliceStationResponse>> getPoliceStationsBySubdivisionId(@RequestParam Long subdivisionId) {
        List<PoliceStationResponse> policeStations = policeStationService.getPoliceStationsBySubdivisionId(subdivisionId).stream()
                .map(policeStation -> new PoliceStationResponse(policeStation.getPoliceStationId(), policeStation.getPoliceStationName()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(policeStations);
    }
}
