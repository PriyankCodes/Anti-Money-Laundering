package com.tss.aml.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.tss.aml.entity.Admin;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByEmail(String email);
    
    // Phone number uniqueness validation
    Optional<Admin> findByPhone(String phone);
    boolean existsByPhone(String phone);
    
    // Check if phone exists excluding current admin
    @Query("SELECT COUNT(a) > 0 FROM Admin a WHERE a.phone = :phone AND a.userId != :userId")
    boolean existsByPhoneAndUserIdNot(@Param("phone") String phone, @Param("userId") Long userId);
}
