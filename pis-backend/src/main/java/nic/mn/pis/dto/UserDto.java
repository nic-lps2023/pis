package nic.mn.pis.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import nic.mn.pis.enums.Gender;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private Long userId;
    private String fullName;
    private String email;
    private String password;
    private String phoneNumber;
    private Gender gender;
    private String address;
    private String profilePicture;
    private Boolean isActive;
    private Boolean isVerified;

    private Long roleId;
    private String roleName;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime createdAt;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime updatedOn;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime lastLogin;
}
