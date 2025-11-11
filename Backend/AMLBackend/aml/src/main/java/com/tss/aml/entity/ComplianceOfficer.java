package com.tss.aml.entity;

import com.tss.aml.entity.enums.UserRole;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "compliance_officers")
public class ComplianceOfficer extends User {

	@NotNull
	private String firstName;

	@NotNull
	private String lastName;

	private String phone;

	public ComplianceOfficer() {
	}

	public ComplianceOfficer(String email, String passwordHash, String firstName, String lastName, String phone) {
		super(email, passwordHash, UserRole.COMPLIANCE_OFFICER);
		this.firstName = firstName;
		this.lastName = lastName;
		this.phone = phone;
	}

	public String getFirstName() {
		return firstName;
	}

	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}

	public String getLastName() {
		return lastName;
	}

	public void setLastName(String lastName) {
		this.lastName = lastName;
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
	}
}