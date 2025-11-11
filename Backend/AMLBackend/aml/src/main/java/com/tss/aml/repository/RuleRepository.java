package com.tss.aml.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tss.aml.entity.Rule;
import com.tss.aml.entity.enums.RuleType;

public interface RuleRepository extends JpaRepository<Rule, Long> {
    List<Rule> findByIsActiveTrue();
    
    Optional<Rule> findByNameAndIsActiveTrue(String ruleName);
    
    // Find rule by name (regardless of active status)
    Rule findByName(String name);
    
    // New methods for admin dashboard and compliance
    long countByIsActiveTrue();
    List<Rule> findByTypeAndIsActiveTrue(RuleType ruleType);
}