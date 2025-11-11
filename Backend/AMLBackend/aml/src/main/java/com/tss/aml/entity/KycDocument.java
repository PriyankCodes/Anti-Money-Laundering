package com.tss.aml.entity;

import java.time.LocalDateTime;

import com.tss.aml.entity.enums.DocumentType;
import com.tss.aml.entity.enums.KycStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "kyc_documents")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class KycDocument {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@NotNull
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "customer_id", nullable = false)
	private Customer customer;

	@NotNull
	@Enumerated(EnumType.STRING)
	private DocumentType docType;

	@NotNull
	@Enumerated(EnumType.STRING)
	private KycStatus status = KycStatus.PENDING;

	@NotNull
	private String fileName;

	@NotNull
	private String fileUrl; // File storage URL

	@Column(name = "file_size")
	private Long fileSize;

	@Column(name = "verification_notes", length = 1000)
	private String verificationNotes;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "verified_by")
	private ComplianceOfficer verifiedBy;

	@Column(name = "upload_timestamp")
	private LocalDateTime uploadTimestamp = LocalDateTime.now();

	@Column(name = "verification_timestamp")
	private LocalDateTime verificationTimestamp;

	@Column(name = "is_validated")
	private boolean validated = false;

	public KycDocument(Customer customer, DocumentType docType, String fileName, String fileUrl) {
		this.customer = customer;
		this.docType = docType;
		this.fileName = fileName;
		this.fileUrl = fileUrl;
	}
}