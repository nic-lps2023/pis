package nic.mn.pis.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    private String userId; // email or phone
    private String password;
}
