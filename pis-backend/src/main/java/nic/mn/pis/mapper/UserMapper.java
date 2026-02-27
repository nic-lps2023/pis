package nic.mn.pis.mapper;

import nic.mn.pis.dto.UserDto;
import nic.mn.pis.entity.Role;
import nic.mn.pis.entity.User;

public class UserMapper {

    public static UserDto mapToUserDto(User user) {

        UserDto userDto = new UserDto();
        userDto.setUserId(user.getUserId());
        userDto.setFullName(user.getFullName());
        userDto.setEmail(user.getEmail());
        userDto.setPassword(user.getPassword());
        userDto.setPhoneNumber(user.getPhoneNumber());
        userDto.setGender(user.getGender());
        userDto.setAddress(user.getAddress());
        userDto.setProfilePicture(user.getProfilePicture());
        userDto.setIsActive(user.getIsActive());
        userDto.setIsVerified(user.getIsVerified());
        userDto.setCreatedAt(user.getCreatedAt());
        userDto.setUpdatedOn(user.getUpdatedOn());
        userDto.setLastLogin(user.getLastLogin());

        if (user.getRole() != null) {
            userDto.setRoleId(user.getRole().getRoleId());
            userDto.setRoleName(user.getRole().getRoleName());
        }

        return userDto;
    }

    public static User mapToUser(UserDto userDto) {

        User user = new User();
        user.setUserId(userDto.getUserId());
        user.setFullName(userDto.getFullName());
        user.setEmail(userDto.getEmail());
        user.setPassword(userDto.getPassword());
        user.setPhoneNumber(userDto.getPhoneNumber());
        user.setGender(userDto.getGender());
        user.setAddress(userDto.getAddress());
        user.setProfilePicture(userDto.getProfilePicture());
        user.setIsActive(userDto.getIsActive());
        user.setIsVerified(userDto.getIsVerified());
        user.setCreatedAt(userDto.getCreatedAt());
        user.setUpdatedOn(userDto.getUpdatedOn());
        user.setLastLogin(userDto.getLastLogin());

        if (userDto.getRoleId() != null) {
            Role role = new Role();
            role.setRoleId(userDto.getRoleId());
            role.setRoleName(userDto.getRoleName());
            user.setRole(role);
        }

        return user;
    }
}
