package nic.mn.pis.controller;

import lombok.AllArgsConstructor;
import nic.mn.pis.entity.Role;
import nic.mn.pis.service.RoleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin("*")
@AllArgsConstructor
@RestController
@RequestMapping("/api/roles")
public class RoleController {
    private RoleService roleService;
    @GetMapping
    public ResponseEntity<List<Role>> getAllRoles(){
        return ResponseEntity.ok(roleService.getAllRoles());
    }
}
