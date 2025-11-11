package com.tss.aml.dto.response;

import java.time.LocalDateTime;

public class TopRiskCustomerDto {
    private Long id;
    private String name;
    private Integer riskScore;
    private Long alertCount;
    private LocalDateTime lastActivity;

    // Constructors
    public TopRiskCustomerDto() {}

    public TopRiskCustomerDto(Long id, String name, Integer riskScore, Long alertCount, LocalDateTime lastActivity) {
        this.id = id;
        this.name = name;
        this.riskScore = riskScore;
        this.alertCount = alertCount;
        this.lastActivity = lastActivity;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(Integer riskScore) {
        this.riskScore = riskScore;
    }

    public Long getAlertCount() {
        return alertCount;
    }

    public void setAlertCount(Long alertCount) {
        this.alertCount = alertCount;
    }

    public LocalDateTime getLastActivity() {
        return lastActivity;
    }

    public void setLastActivity(LocalDateTime lastActivity) {
        this.lastActivity = lastActivity;
    }
}
