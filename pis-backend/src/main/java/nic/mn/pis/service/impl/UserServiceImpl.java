package nic.mn.pis.service.impl;

import lombok.AllArgsConstructor;
import nic.mn.pis.dto.UserDto;
import nic.mn.pis.entity.Role;
import nic.mn.pis.entity.User;
import nic.mn.pis.exception.ResourceNotFoundException;
import nic.mn.pis.mapper.UserMapper;
import nic.mn.pis.repository.RoleRepository;
import nic.mn.pis.repository.UserRepository;
import nic.mn.pis.service.UserService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class UserServiceImpl implements UserService {

    private UserRepository userRepository;
    private RoleRepository roleRepository;
    private BCryptPasswordEncoder passwordEncoder;

    @Override
    public UserDto createUser(UserDto userDto) {

        User user = UserMapper.mapToUser(userDto);

        // ✅ Encrypt password
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));

        // ✅ Default role Applicant (RoleId = 7)
        Role role = roleRepository.findById(7L)
                .orElseThrow(() -> new ResourceNotFoundException("Applicant Role not found with id 7"));

        user.setRole(role);
        user.setLastLogin(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        return UserMapper.mapToUserDto(savedUser);
    }

    @Override
    public UserDto getUserById(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User does not exist with id " + userId));

        return UserMapper.mapToUserDto(user);
    }

    @Override
    public List<UserDto> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(UserMapper::mapToUserDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserDto updateUser(Long userId, UserDto updatedUserDetails) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User does not exist with id " + userId));

        user.setFullName(updatedUserDetails.getFullName());
        user.setEmail(updatedUserDetails.getEmail());
        user.setPhoneNumber(updatedUserDetails.getPhoneNumber());
        user.setGender(updatedUserDetails.getGender());
        user.setAddress(updatedUserDetails.getAddress());
        user.setProfilePicture(updatedUserDetails.getProfilePicture());
        user.setIsActive(updatedUserDetails.getIsActive());
        user.setIsVerified(updatedUserDetails.getIsVerified());
        user.setLastLogin(LocalDateTime.now());

        // Only update password if given
        if (updatedUserDetails.getPassword() != null && !updatedUserDetails.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(updatedUserDetails.getPassword()));
        }

        User updatedUserObj = userRepository.save(user);

        return UserMapper.mapToUserDto(updatedUserObj);
    }

    @Override
    public void deleteUser(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User does not exist with id " + userId));

        userRepository.delete(user);
    }

    @Override
    public boolean isEmailRegistered(String email, Long userId) {

        if (userId != null && userId > 0) {
            return userRepository.existsByEmailAndUserIdNot(email, userId);
        }
        return userRepository.existsByEmail(email);
    }

    @Override
    public boolean isPhoneRegistered(String phoneNumber, Long userId) {

        if (userId != null && userId > 0) {
            return userRepository.existsByPhoneNumberAndUserIdNot(phoneNumber, userId);
        }
        return userRepository.existsByPhoneNumber(phoneNumber);
    }
}
