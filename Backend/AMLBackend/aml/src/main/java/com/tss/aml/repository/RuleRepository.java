package com.tss.aml.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tss.aml.entity.Rule;
import com.tss.aml.entity.enums.RuleType;

public interface RuleRepository extends JpaRepository<Rule, Long> {
    List<Rule> findByIsActiveTrue();
    
    Optional<Rule> findByNameAndIsActiveTrue(String ruleName);
    
    // New methods for admin dashboard and compliance
    long countByIsActiveTrue();
    List<Rule> findByTypeAndIsActiveTrue(RuleType ruleType);
}