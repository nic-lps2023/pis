package nic.mn.pis.repository;

import nic.mn.pis.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);

    // For update case (ignore current userId)
    boolean existsByEmailAndUserIdNot(String email, Long userId);

    boolean existsByPhoneNumberAndUserIdNot(String phoneNumber, Long userId);

    Optional<User> findByEmail(String email);

    Optional<User> findByPhoneNumber(String phoneNumber);

    Optional<User> findByEmailOrPhoneNumber(String email, String phoneNumber);
}
