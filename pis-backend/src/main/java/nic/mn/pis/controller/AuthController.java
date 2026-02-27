package nic.mn.pis.controller;

import lombok.AllArgsConstructor;
import nic.mn.pis.dto.LoginRequest;
import nic.mn.pis.dto.LoginResponse;
import nic.mn.pis.entity.User;
import nic.mn.pis.repository.UserRepository;
import nic.mn.pis.security.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin("*")
@AllArgsConstructor
public class AuthController {

    private UserRepository userRepository;
    private BCryptPasswordEncoder passwordEncoder;
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest loginRequest) {

        Optional<User> userOptional = userRepository.findByEmailOrPhoneNumber(
                loginRequest.getUserId(),
                loginRequest.getUserId()
        );

        if (userOptional.isEmpty()) {
            return new LoginResponse(false, "Invalid Email/Mobile Number!", null, null,
                    null, null, null, null, null);
        }

        User user = userOptional.get();

        // BCrypt password check
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            return new LoginResponse(false, "Invalid Password!", null, null,
                    null, null, null, null, null);
        }

        // Generate JWT Token
        String token = jwtUtil.generateToken(user.getEmail());

        LoginResponse response = new LoginResponse();
        response.setSuccess(true);
        response.setMessage("Login Successful!");
        response.setUserId(user.getUserId());
        response.setFullName(user.getFullName());
        response.setEmail(user.getEmail());
        response.setPhoneNumber(user.getPhoneNumber());
        response.setRoleId(user.getRole().getRoleId());
        response.setRoleName(user.getRole().getRoleName());
        response.setToken(token);

        return response;
    }
}
