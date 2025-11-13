package com.tss.aml.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.tss.aml.entity.ComplianceOfficer;

public interface ComplianceOfficerRepository extends JpaRepository<ComplianceOfficer, Long> {
    Optional<ComplianceOfficer> findByEmail(String email);
    
    // Phone number uniqueness validation
    Optional<ComplianceOfficer> findByPhone(String phone);
    boolean existsByPhone(String phone);
    
    // Check if phone exists excluding current officer
    @Query("SELECT COUNT(o) > 0 FROM ComplianceOfficer o WHERE o.phone = :phone AND o.userId != :userId")
    boolean existsByPhoneAndUserIdNot(@Param("phone") String phone, @Param("userId") Long userId);
}