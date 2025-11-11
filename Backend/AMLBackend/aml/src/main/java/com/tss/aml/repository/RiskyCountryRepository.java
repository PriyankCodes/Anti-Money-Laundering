package com.tss.aml.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tss.aml.entity.RiskyCountry;

public interface RiskyCountryRepository extends JpaRepository<RiskyCountry, String> {
}