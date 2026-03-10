package nic.mn.pis.service.impl;

import lombok.AllArgsConstructor;
import nic.mn.pis.dto.UserDto;
import nic.mn.pis.entity.Role;
import nic.mn.pis.entity.Subdivision;
import nic.mn.pis.entity.User;
import nic.mn.pis.exception.ResourceNotFoundException;
import nic.mn.pis.mapper.UserMapper;
import nic.mn.pis.repository.PoliceStationRepository;
import nic.mn.pis.repository.RoleRepository;
import nic.mn.pis.repository.SubdivisionRepository;
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
    private PoliceStationRepository policeStationRepository;
    private SubdivisionRepository subdivisionRepository;
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

        if (userDto.getPoliceStationId() != null) {
            user.setPoliceStation(policeStationRepository.findById(userDto.getPoliceStationId())
                .orElseThrow(() -> new ResourceNotFoundException("Police station does not exist with id " + userDto.getPoliceStationId())));
        }

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

        if (updatedUserDetails.getRoleId() != null) {
            Role role = roleRepository.findById(updatedUserDetails.getRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Role does not exist with id " + updatedUserDetails.getRoleId()));
            user.setRole(role);
        }

        Long effectiveRoleId = user.getRole() != null ? user.getRole().getRoleId() : null;

        if (Long.valueOf(4L).equals(effectiveRoleId)) {
            if (updatedUserDetails.getSubdivisionId() != null) {
                Subdivision subdivision = subdivisionRepository.findById(updatedUserDetails.getSubdivisionId())
                        .orElseThrow(() -> new ResourceNotFoundException("Subdivision does not exist with id " + updatedUserDetails.getSubdivisionId()));
                user.setSubdivision(subdivision);
            } else {
                user.setSubdivision(null);
            }
            user.setPoliceStation(null);
        } else if (Long.valueOf(5L).equals(effectiveRoleId)) {
            if (updatedUserDetails.getPoliceStationId() != null) {
                var policeStation = policeStationRepository.findById(updatedUserDetails.getPoliceStationId())
                        .orElseThrow(() -> new ResourceNotFoundException("Police station does not exist with id " + updatedUserDetails.getPoliceStationId()));
                user.setPoliceStation(policeStation);
                user.setSubdivision(policeStation.getSubdivision());
            } else {
                user.setPoliceStation(null);
                user.setSubdivision(null);
            }
        } else {
            user.setPoliceStation(null);
            user.setSubdivision(null);
        }

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
