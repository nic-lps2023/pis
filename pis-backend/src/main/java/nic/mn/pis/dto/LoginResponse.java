package nic.mn.pis.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private boolean success;
    private String message;

    private Long userId;
    private String fullName;
    private String email;
    private String phoneNumber;

    private Long roleId;
    private String roleName;

    private String token;  // ✅ JWT Token
}
