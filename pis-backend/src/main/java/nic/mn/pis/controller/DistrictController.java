package nic.mn.pis.controller;

import lombok.AllArgsConstructor;
import nic.mn.pis.dto.DistrictRequest;
import nic.mn.pis.dto.DistrictResponse;
import nic.mn.pis.entity.District;
import nic.mn.pis.service.DistrictService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin("*")
@AllArgsConstructor
@RestController
@RequestMapping("/api/districts")
public class DistrictController {

    private DistrictService districtService;

    @PostMapping
    public ResponseEntity<District> createDistrict(@RequestBody DistrictRequest request) {
        District district = districtService.createDistrict(request.getDistrictName());
        return new ResponseEntity<>(district, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<DistrictResponse>> getAllDistricts() {
        List<DistrictResponse> districts = districtService.getAllDistricts().stream()
                .map(district -> new DistrictResponse(district.getDistrictId(), district.getDistrictName()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(districts);
    }
}
