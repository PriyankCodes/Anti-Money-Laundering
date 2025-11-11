package com.tss.aml.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.tss.aml.entity.enums.RateSource;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Table(name = "currency_exchange", uniqueConstraints = @UniqueConstraint(columnNames = { "fromCurrency",
		"toCurrency" }))
@Data
@RequiredArgsConstructor
@AllArgsConstructor
public class CurrencyExchange {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 3)
	private String fromCurrency;

	@Column(nullable = false, length = 3)
	private String toCurrency;

	@Column(nullable = false, precision = 15, scale = 6)
	private BigDecimal conversionRate;

	@Column(nullable = false, precision = 5, scale = 2)
	private BigDecimal conversionFeePercent;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal minimumFee;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal maximumFee;

	@Column(nullable = false)
	private Boolean isActive = true;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private RateSource rateSource = RateSource.MANUAL;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime lastUpdated;

	@PrePersist
	public void prePersist() {
		createdAt = LocalDateTime.now();
		lastUpdated = LocalDateTime.now();
	}

	@PreUpdate
	public void preUpdate() {
		lastUpdated = LocalDateTime.now();
	}

	public BigDecimal calculateFee(BigDecimal amount) {
		BigDecimal fee = amount.multiply(conversionFeePercent).divide(BigDecimal.valueOf(100));
		if (fee.compareTo(minimumFee) < 0)
			fee = minimumFee;
		if (fee.compareTo(maximumFee) > 0)
			fee = maximumFee;
		return fee;
	}
}
