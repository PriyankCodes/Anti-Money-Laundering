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

import com.tss.aml.dto.response.AlertTrendDto;
import com.tss.aml.dto.response.ChartDataDto;
import com.tss.aml.dto.response.DashboardStatsDto;
import com.tss.aml.dto.response.RecentActivityDto;
import com.tss.aml.service.DashboardService;

@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN') or hasRole('COMPLIANCE_OFFICER')")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class AdminDashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getDashboardStats() {
        DashboardStatsDto stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/alert-trend")
    public ResponseEntity<AlertTrendDto> getAlertTrend(
            @RequestParam(defaultValue = "30") int days) {
        AlertTrendDto trend = dashboardService.getAlertTrend(days);
        return ResponseEntity.ok(trend);
    }

    @GetMapping("/transaction-volume")
    public ResponseEntity<AlertTrendDto> getTransactionVolume(
            @RequestParam(defaultValue = "30") int days) {
        AlertTrendDto volume = dashboardService.getTransactionVolume(days);
        return ResponseEntity.ok(volume);
    }

    @GetMapping("/risk-distribution")
    public ResponseEntity<ChartDataDto> getRiskDistribution() {
        ChartDataDto distribution = dashboardService.getRiskDistribution();
        return ResponseEntity.ok(distribution);
    }

    @GetMapping("/recent-activities")
    public ResponseEntity<List<RecentActivityDto>> getRecentActivities(
            @RequestParam(defaultValue = "10") int limit) {
        List<RecentActivityDto> activities = dashboardService.getRecentActivities(limit);
        return ResponseEntity.ok(activities);
    }
}
