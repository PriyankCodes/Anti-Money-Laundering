package com.tss.aml.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.tss.aml.entity.enums.RiskLevel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "risky_countries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})

public class RiskyCountry {

	@Id
	@NotNull
	@Column(length = 2) // ISO 3166-1 alpha-2, e.g., "IN", "US"
	private String countryCode;

	@NotNull
	private String countryName;

	@Enumerated(EnumType.STRING)
	@NotNull
	private RiskLevel riskLevel;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "last_updated_by")
	private Admin lastUpdatedBy;

	private LocalDateTime lastUpdatedAt = LocalDateTime.now();

	public RiskyCountry(String countryCode, String countryName, RiskLevel riskLevel) {
		this.countryCode = countryCode;
		this.countryName = countryName;
		this.riskLevel = riskLevel;
	}

	// Getters & Setters
	public String getCountryCode() {
		return countryCode;
	}

	public void setCountryCode(String countryCode) {
		this.countryCode = countryCode;
	}

	public String getCountryName() {
		return countryName;
	}

	public void setCountryName(String countryName) {
		this.countryName = countryName;
	}

	public RiskLevel getRiskLevel() {
		return riskLevel;
	}

	public void setRiskLevel(RiskLevel riskLevel) {
		this.riskLevel = riskLevel;
	}

	public Admin getLastUpdatedBy() {
		return lastUpdatedBy;
	}

	public void setLastUpdatedBy(Admin lastUpdatedBy) {
		this.lastUpdatedBy = lastUpdatedBy;
	}

	public LocalDateTime getLastUpdatedAt() {
		return lastUpdatedAt;
	}

	public void setLastUpdatedAt(LocalDateTime lastUpdatedAt) {
		this.lastUpdatedAt = lastUpdatedAt;
	}
}