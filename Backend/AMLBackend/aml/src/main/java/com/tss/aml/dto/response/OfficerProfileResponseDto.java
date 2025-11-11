package com.tss.aml.dto.response;

import java.time.LocalDateTime;

import com.tss.aml.entity.enums.UserStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OfficerProfileResponseDto {
	private Long officerId;
	private String firstName;
	private String lastName;
	private String email;
	private String phoneNumber;
	private String department;
	private String badgeNumber;
	private LocalDateTime hireDate;
	private UserStatus status;
	private LocalDateTime createdAt;
	private LocalDateTime lastLoginAt;

}
