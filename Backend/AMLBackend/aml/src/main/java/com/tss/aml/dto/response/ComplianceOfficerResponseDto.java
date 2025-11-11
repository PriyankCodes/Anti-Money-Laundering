package com.tss.aml.dto.response;

import java.time.LocalDateTime;

import com.tss.aml.entity.enums.UserStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceOfficerResponseDto {

	private Long userId;
	private String email;
	private String firstName;
	private String lastName;
	private String phoneNumber;
	private UserStatus status;
	private String department;
	private Integer assignedAlertsCount;
	private LocalDateTime lastLoginAt;
	private LocalDateTime createdAt;
}