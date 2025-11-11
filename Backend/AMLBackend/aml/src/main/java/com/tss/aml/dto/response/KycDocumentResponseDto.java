package com.tss.aml.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.tss.aml.entity.enums.DocumentType;
import com.tss.aml.entity.enums.KycStatus;
import com.tss.aml.entity.enums.UserStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class KycDocumentResponseDto {
	// Document fields
	private Long id;
	private DocumentType documentType;
	private String fileName;
	private String fileUrl;
	private Long fileSize;
	private KycStatus status;
	private LocalDateTime uploadTimestamp;
	private LocalDateTime verificationTimestamp;
	private String verificationNotes;
	private String verifiedByName;
	private boolean validated;
	
	// Customer fields
	private Long customerId;
	private String customerName;
	private String firstName;
	private String middleName;
	private String lastName;
	private String email;
	private String contactNumber;
	private LocalDate dateOfBirth;
	private String nationality;
	private String street;
	private String city;
	private String state;
	private String country;
	private String pincode;
	private KycStatus customerKycStatus;
	private UserStatus customerStatus;
	private LocalDateTime customerCreatedAt;
	private LocalDateTime customerLastLogin;
	private boolean emailVerified;

}
