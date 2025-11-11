package com.tss.aml.service;

import java.util.List;

import com.tss.aml.dto.response.ChartDataDto;
import com.tss.aml.dto.response.ReportStatsDto;
import com.tss.aml.dto.response.TopRiskCustomerDto;
import com.tss.aml.dto.response.TrendDataDto;

public interface ReportsService {
    
    ReportStatsDto getReportStats(String period);
    
    ChartDataDto getAlertsByType(String period);
    
    ChartDataDto getAlertsByStatus(String period);
    
    List<TrendDataDto> getTrends(String period);
    
    List<TopRiskCustomerDto> getTopRiskCustomers(int limit);
}
