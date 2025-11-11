package com.tss.aml.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
	private Long totalCustomers;
	private Long activeCustomers;
	private Long totalTransactions;
	private Long pendingAlerts;
	private Long highRiskAlerts;
	private Long totalComplianceOfficers;
	private Long pendingKycDocuments;
	private Long activeRules;
	private Long totalUsers;
	private Long totalOfficers;
	private Long totalAlerts;
	private Long totalSARs;
	private Long activeAccounts;
	private Long openHelpTickets;
	

}
