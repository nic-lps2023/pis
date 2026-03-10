package nic.mn.pis.controller;

import lombok.AllArgsConstructor;
import nic.mn.pis.dto.SubdivisionRequest;
import nic.mn.pis.dto.SubdivisionResponse;
import nic.mn.pis.entity.Subdivision;
import nic.mn.pis.service.SubdivisionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin("*")
@AllArgsConstructor
@RestController
@RequestMapping("/api/subdivisions")
public class SubdivisionController {

    private SubdivisionService subdivisionService;

    @PostMapping
    public ResponseEntity<Subdivision> createSubdivision(@RequestBody SubdivisionRequest request) {
        Subdivision subdivision = subdivisionService.createSubdivision(request.getSubdivisionName(), request.getDistrictId());
        return new ResponseEntity<>(subdivision, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<SubdivisionResponse>> getSubdivisionsByDistrictId(@RequestParam Long districtId) {
        List<SubdivisionResponse> subdivisions = subdivisionService.getSubdivisionsByDistrictId(districtId).stream()
                .map(subdivision -> new SubdivisionResponse(subdivision.getSubdivisionId(), subdivision.getSubdivisionName()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(subdivisions);
    }
}
