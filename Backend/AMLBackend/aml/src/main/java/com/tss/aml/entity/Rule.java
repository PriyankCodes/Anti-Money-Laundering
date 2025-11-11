package com.tss.aml.entity;

import java.time.LocalDateTime;

import com.tss.aml.entity.enums.RuleType;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Rule {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long ruleId;

	@NotNull
	private String name;
	private String description;

	@Enumerated(EnumType.STRING)
	@NotNull
	private RuleType type;

	@NotNull
	@Lob
	private String conditions;

	@NotNull
	private Integer riskScoreImpact;
	private boolean isActive = true;
	private LocalDateTime createdAt = LocalDateTime.now();
	private LocalDateTime updatedAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "updated_by")
	private Admin updatedBy;

	public Rule(String name, RuleType type, String conditions, int riskScoreImpact) {
		this.name = name;
		this.type = type;
		this.conditions = conditions;
		this.riskScoreImpact = riskScoreImpact;
	}

}