package com.tss.aml.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "suspicious_keywords")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SuspiciousKeyword {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long keywordId;

	@NotNull
	@Column
	private String word;

	@NotNull
	private String category;
	@NotNull
	private Integer severity;
	private boolean isActive = true;

	public SuspiciousKeyword(String word, String category, int severity) {
		this.word = word;
		this.category = category;
		this.severity = severity;
	}

}