package nic.mn.pis.controller;

import lombok.AllArgsConstructor;
import nic.mn.pis.dto.UserDto;
import nic.mn.pis.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin("*")
@AllArgsConstructor
@RestController
@RequestMapping("/api/users")
public class UserController {

    private UserService userService;

    // Build Add User REST API
    @PostMapping
    public ResponseEntity<UserDto> createUser(@RequestBody UserDto userDto) {

        UserDto savedUser = userService.createUser(userDto);
        return new ResponseEntity<>(savedUser, HttpStatus.CREATED);
    }

    // Build Get User REST API
    @GetMapping("{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable("id") Long userId) {

        UserDto userDto = userService.getUserById(userId);
        return ResponseEntity.ok(userDto);
    }

    // Build Get All Users REST API
    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {

        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // Build Update User REST API
    @PutMapping("{id}")
    public ResponseEntity<UserDto> updateUser(@PathVariable("id") Long userId,
                                              @RequestBody UserDto updatedUser) {

        UserDto userDto = userService.updateUser(userId, updatedUser);
        return ResponseEntity.ok(userDto);
    }

    // Build Delete User REST API
    @DeleteMapping("{id}")
    public ResponseEntity<String> deleteUser(@PathVariable("id") Long userId) {

        userService.deleteUser(userId);
        return ResponseEntity.ok("User deleted successfully!");
    }

    // Build Check Email already exists REST API
    @GetMapping("/check-email")
    public ResponseEntity<Boolean> checkEmailExists(
            @RequestParam String email,
            @RequestParam(required = false, defaultValue = "0") Long userId
    ) {
        boolean exists = userService.isEmailRegistered(email, userId);
        return ResponseEntity.ok(exists);
    }

    // Build Check Phone No. already exists REST API
    @GetMapping("/check-phone")
    public ResponseEntity<Boolean> checkPhoneExists(
            @RequestParam String phoneNumber,
            @RequestParam(required = false, defaultValue = "0") Long userId
    ) {
        boolean exists = userService.isPhoneRegistered(phoneNumber, userId);
        return ResponseEntity.ok(exists);
    }

}
