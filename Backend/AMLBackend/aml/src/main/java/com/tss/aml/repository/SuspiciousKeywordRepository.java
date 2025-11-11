package com.tss.aml.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tss.aml.entity.SuspiciousKeyword;

public interface SuspiciousKeywordRepository extends JpaRepository<SuspiciousKeyword, Long> {
    List<SuspiciousKeyword> findByIsActiveTrue();
}