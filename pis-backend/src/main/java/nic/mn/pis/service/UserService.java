package nic.mn.pis.service;

import nic.mn.pis.dto.UserDto;

import java.util.List;

public interface UserService {

    UserDto createUser(UserDto userDto);

    UserDto getUserById(Long userId);

    List<UserDto> getAllUsers();

    UserDto updateUser(Long userId, UserDto updatedUserDetails);

    void deleteUser(Long userId);

    boolean isEmailRegistered(String email, Long userId);

    boolean isPhoneRegistered(String phoneNumber, Long userId);
}
