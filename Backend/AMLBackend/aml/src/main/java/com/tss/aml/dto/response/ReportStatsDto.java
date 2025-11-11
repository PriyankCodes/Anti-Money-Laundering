package com.tss.aml.dto.response;

public class ReportStatsDto {
    private Long totalTransactions;
    private Long flaggedTransactions;
    private Long totalAlerts;
    private Long resolvedAlerts;
    private Long pendingAlerts;
    private Long totalSARs;
    private Long submittedSARs;
    private Long draftedSARs;
    private Long highRiskCustomers;
    private Double averageRiskScore;

    // Constructors
    public ReportStatsDto() {}

    public ReportStatsDto(Long totalTransactions, Long flaggedTransactions, Long totalAlerts,
                         Long resolvedAlerts, Long pendingAlerts, Long totalSARs,
                         Long submittedSARs, Long draftedSARs, Long highRiskCustomers,
                         Double averageRiskScore) {
        this.totalTransactions = totalTransactions;
        this.flaggedTransactions = flaggedTransactions;
        this.totalAlerts = totalAlerts;
        this.resolvedAlerts = resolvedAlerts;
        this.pendingAlerts = pendingAlerts;
        this.totalSARs = totalSARs;
        this.submittedSARs = submittedSARs;
        this.draftedSARs = draftedSARs;
        this.highRiskCustomers = highRiskCustomers;
        this.averageRiskScore = averageRiskScore;
    }

    // Getters and Setters
    public Long getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(Long totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public Long getFlaggedTransactions() {
        return flaggedTransactions;
    }

    public void setFlaggedTransactions(Long flaggedTransactions) {
        this.flaggedTransactions = flaggedTransactions;
    }

    public Long getTotalAlerts() {
        return totalAlerts;
    }

    public void setTotalAlerts(Long totalAlerts) {
        this.totalAlerts = totalAlerts;
    }

    public Long getResolvedAlerts() {
        return resolvedAlerts;
    }

    public void setResolvedAlerts(Long resolvedAlerts) {
        this.resolvedAlerts = resolvedAlerts;
    }

    public Long getPendingAlerts() {
        return pendingAlerts;
    }

    public void setPendingAlerts(Long pendingAlerts) {
        this.pendingAlerts = pendingAlerts;
    }

    public Long getTotalSARs() {
        return totalSARs;
    }

    public void setTotalSARs(Long totalSARs) {
        this.totalSARs = totalSARs;
    }

    public Long getSubmittedSARs() {
        return submittedSARs;
    }

    public void setSubmittedSARs(Long submittedSARs) {
        this.submittedSARs = submittedSARs;
    }

    public Long getDraftedSARs() {
        return draftedSARs;
    }

    public void setDraftedSARs(Long draftedSARs) {
        this.draftedSARs = draftedSARs;
    }

    public Long getHighRiskCustomers() {
        return highRiskCustomers;
    }

    public void setHighRiskCustomers(Long highRiskCustomers) {
        this.highRiskCustomers = highRiskCustomers;
    }

    public Double getAverageRiskScore() {
        return averageRiskScore;
    }

    public void setAverageRiskScore(Double averageRiskScore) {
        this.averageRiskScore = averageRiskScore;
    }
}
