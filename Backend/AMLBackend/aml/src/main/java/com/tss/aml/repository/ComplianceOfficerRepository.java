package com.tss.aml.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tss.aml.entity.ComplianceOfficer;

public interface ComplianceOfficerRepository extends JpaRepository<ComplianceOfficer, Long> {
    Optional<ComplianceOfficer> findByEmail(String email);
}