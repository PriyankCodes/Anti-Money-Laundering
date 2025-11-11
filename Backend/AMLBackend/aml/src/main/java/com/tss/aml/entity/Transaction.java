
package com.tss.aml.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.tss.aml.entity.enums.TransactionStatus;
import com.tss.aml.entity.enums.TransactionType;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "transactions", indexes = {
		@Index(name = "idx_transactions_customer_status", columnList = "customer_id,status"),
		@Index(name = "idx_transactions_country", columnList = "countryCode"),
		@Index(name = "idx_transactions_timestamp", columnList = "timestamp DESC") // optional: for time-range queries
})
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transaction {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long transactionId;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "customer_id", nullable = false)
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "passwordHash" })
	private Customer customer;

	@NotNull
	private String senderAccountNumber;

	@NotNull
	private BigDecimal amount;

	@NotNull
	private String currency;

	// Currency exchange reference
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "currency_exchange_id")
	@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
	private CurrencyExchange currencyExchange;

	private LocalDateTime timestamp = LocalDateTime.now();
	private String description;
	private String counterpartyName;
	private String counterpartyAccount;
	private String countryCode; // Sender's country code
	private String counterpartyCountryCode; // Receiver's/Counterparty's country code

	@Enumerated(EnumType.STRING)
	@NotNull
	private TransactionType transactionType;

	@Enumerated(EnumType.STRING)
	@NotNull
	private TransactionStatus status = TransactionStatus.PENDING;

	private Integer riskScore = 0;

	public Transaction(Customer customer, String senderAccNumber, BigDecimal amount,
			String currency, String description, TransactionType type) {
		this.customer = customer;
		this.senderAccountNumber = senderAccNumber;
		this.amount = amount;
		this.currency = currency;
		this.description = description;
		this.transactionType = type;
	}

}