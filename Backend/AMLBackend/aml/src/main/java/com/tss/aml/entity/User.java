package com.tss.aml.entity;

import java.time.LocalDateTime;

import com.tss.aml.entity.enums.UserRole;
import com.tss.aml.entity.enums.UserStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class User {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long userId;

	@Email
	@NotNull
	@Column(unique = true)
	private String email;

	@NotNull
	private String passwordHash;

	@Enumerated(EnumType.STRING)
	@NotNull
	private UserRole role;

	@Column(length = 50)
	@Enumerated(EnumType.STRING)
	private UserStatus status = UserStatus.PENDING_VERIFICATION;

	private LocalDateTime createdAt = LocalDateTime.now();
	private LocalDateTime lastLogin;

	private boolean emailVerified = false;
	
	// Password reset OTP fields
	private String passwordResetOtp;
	private LocalDateTime passwordResetOtpExpiry;

	public User(String email, String passwordHash, UserRole role) {
		this.email = email;
		this.passwordHash = passwordHash;
		this.role = role;
	}

}