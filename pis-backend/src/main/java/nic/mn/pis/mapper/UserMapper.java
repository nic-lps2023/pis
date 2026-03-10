package nic.mn.pis.mapper;

import nic.mn.pis.dto.UserDto;
import nic.mn.pis.entity.Role;
import nic.mn.pis.entity.Subdivision;
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

        if (user.getPoliceStation() != null) {
            userDto.setPoliceStationId(user.getPoliceStation().getPoliceStationId());
            userDto.setPoliceStationName(user.getPoliceStation().getPoliceStationName());

            if (user.getPoliceStation().getSubdivision() != null) {
                userDto.setSubdivisionId(user.getPoliceStation().getSubdivision().getSubdivisionId());
                userDto.setSubdivisionName(user.getPoliceStation().getSubdivision().getSubdivisionName());

                if (user.getPoliceStation().getSubdivision().getDistrict() != null) {
                    userDto.setDistrictId(user.getPoliceStation().getSubdivision().getDistrict().getDistrictId());
                    userDto.setDistrictName(user.getPoliceStation().getSubdivision().getDistrict().getDistrictName());
                }
            }
        }

        if (user.getSubdivision() != null) {
            userDto.setSubdivisionId(user.getSubdivision().getSubdivisionId());
            userDto.setSubdivisionName(user.getSubdivision().getSubdivisionName());

            if (user.getSubdivision().getDistrict() != null) {
                userDto.setDistrictId(user.getSubdivision().getDistrict().getDistrictId());
                userDto.setDistrictName(user.getSubdivision().getDistrict().getDistrictName());
            }
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

        if (userDto.getPoliceStationId() != null) {
            nic.mn.pis.entity.PoliceStation policeStation = new nic.mn.pis.entity.PoliceStation();
            policeStation.setPoliceStationId(userDto.getPoliceStationId());
            user.setPoliceStation(policeStation);
        }

        if (userDto.getSubdivisionId() != null) {
            Subdivision subdivision = new Subdivision();
            subdivision.setSubdivisionId(userDto.getSubdivisionId());
            user.setSubdivision(subdivision);
        }

        return user;
    }
}
