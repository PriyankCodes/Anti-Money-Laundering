package com.tss.aml.dto.response;

public class TrendDataDto {
    private String month;
    private Long alerts;
    private Long sars;
    private Long transactions;

    // Constructors
    public TrendDataDto() {}

    public TrendDataDto(String month, Long alerts, Long sars, Long transactions) {
        this.month = month;
        this.alerts = alerts;
        this.sars = sars;
        this.transactions = transactions;
    }

    // Getters and Setters
    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public Long getAlerts() {
        return alerts;
    }

    public void setAlerts(Long alerts) {
        this.alerts = alerts;
    }

    public Long getSars() {
        return sars;
    }

    public void setSars(Long sars) {
        this.sars = sars;
    }

    public Long getTransactions() {
        return transactions;
    }

    public void setTransactions(Long transactions) {
        this.transactions = transactions;
    }
}
