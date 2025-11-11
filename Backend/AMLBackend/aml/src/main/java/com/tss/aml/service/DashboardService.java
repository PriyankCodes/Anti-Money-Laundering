package com.tss.aml.service;

import java.util.List;

import com.tss.aml.dto.response.AlertTrendDto;
import com.tss.aml.dto.response.ChartDataDto;
import com.tss.aml.dto.response.DashboardStatsDto;
import com.tss.aml.dto.response.RecentActivityDto;

public interface DashboardService {
    
    DashboardStatsDto getDashboardStats();
    
    AlertTrendDto getAlertTrend(int days);
    
    AlertTrendDto getTransactionVolume(int days);
    
    ChartDataDto getRiskDistribution();
    
    List<RecentActivityDto> getRecentActivities(int limit);
}
