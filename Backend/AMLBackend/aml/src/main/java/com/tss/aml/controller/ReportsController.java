package com.tss.aml.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.dto.response.ChartDataDto;
import com.tss.aml.dto.response.ReportStatsDto;
import com.tss.aml.dto.response.TopRiskCustomerDto;
import com.tss.aml.dto.response.TrendDataDto;
import com.tss.aml.service.ReportsService;

@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN') or hasRole('COMPLIANCE_OFFICER')")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class ReportsController {

    @Autowired
    private ReportsService reportsService;

    @GetMapping("/stats")
    public ResponseEntity<ReportStatsDto> getReportStats(@RequestParam String period) {
        ReportStatsDto stats = reportsService.getReportStats(period);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/alerts-by-type")
    public ResponseEntity<ChartDataDto> getAlertsByType(
            @RequestParam(required = false) String period) {
        ChartDataDto data = reportsService.getAlertsByType(period);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/alerts-by-status")
    public ResponseEntity<ChartDataDto> getAlertsByStatus(
            @RequestParam(required = false) String period) {
        ChartDataDto data = reportsService.getAlertsByStatus(period);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/trends")
    public ResponseEntity<List<TrendDataDto>> getTrends(@RequestParam String period) {
        List<TrendDataDto> trends = reportsService.getTrends(period);
        return ResponseEntity.ok(trends);
    }

    @GetMapping("/top-risk-customers")
    public ResponseEntity<List<TopRiskCustomerDto>> getTopRiskCustomers(
            @RequestParam(defaultValue = "10") int limit) {
        List<TopRiskCustomerDto> customers = reportsService.getTopRiskCustomers(limit);
        return ResponseEntity.ok(customers);
    }
}
