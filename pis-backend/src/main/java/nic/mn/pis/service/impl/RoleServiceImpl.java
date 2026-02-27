package nic.mn.pis.service.impl;

import lombok.AllArgsConstructor;
import nic.mn.pis.entity.Role;
import nic.mn.pis.repository.RoleRepository;
import nic.mn.pis.service.RoleService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class RoleServiceImpl implements RoleService {

    private RoleRepository roleRepository;

    @Override
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }
}
