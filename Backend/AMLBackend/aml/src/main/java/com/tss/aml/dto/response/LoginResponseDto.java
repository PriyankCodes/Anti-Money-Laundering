package com.tss.aml.dto.response;

import com.tss.aml.entity.enums.UserStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDto {

	private Long userId;
	private String email;
	private String firstName;
	private String lastName;
	private UserStatus status;
	private String token;

}
