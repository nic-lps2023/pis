package nic.mn.pis.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PoliceStationRequest {
    private String policeStationName;
    private Long subdivisionId;
}
