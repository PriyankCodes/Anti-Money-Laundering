package com.tss.aml.service.impl;

import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.response.ChartDataDto;
import com.tss.aml.dto.response.ReportStatsDto;
import com.tss.aml.dto.response.TopRiskCustomerDto;
import com.tss.aml.dto.response.TrendDataDto;
import com.tss.aml.entity.Sar.SarStatus;
import com.tss.aml.entity.enums.AlertStatus;
import com.tss.aml.repository.AlertRepository;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.SarRepository;
import com.tss.aml.repository.TransactionRepository;
import com.tss.aml.service.ReportsService;

@Service
public class ReportsServiceImpl implements ReportsService {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private SarRepository sarRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Override
    public ReportStatsDto getReportStats(String period) {
        LocalDateTime startDate = calculateStartDate(period);

        // Count transactions
        Long totalTransactions = transactionRepository.countByTimestampAfter(startDate);
        Long flaggedTransactions = transactionRepository.countFlaggedTransactionsAfter(startDate);

        // Count alerts
        Long totalAlerts = alertRepository.countByCreatedAtAfter(startDate);
        Long resolvedAlerts = alertRepository.countByStatusAndCreatedAtAfter(AlertStatus.TRUE_POSITIVE, startDate);
        Long pendingAlerts = alertRepository.countByStatusAndCreatedAtAfter(AlertStatus.OPEN, startDate);

        // Count SARs
        Long totalSARs = sarRepository.countByCreatedAtAfter(startDate);
        Long submittedSARs = sarRepository.countByStatusAndCreatedAtAfter(SarStatus.SUBMITTED, startDate);
        Long draftedSARs = sarRepository.countByStatusAndCreatedAtAfter(SarStatus.DRAFT, startDate);

        // Count high risk customers (assuming risk score >= 70 is high risk)
        Long highRiskCustomers = customerRepository.countHighRiskCustomers(70);

        // Calculate average risk score
        Double averageRiskScore = customerRepository.calculateAverageRiskScore();
        if (averageRiskScore == null) {
            averageRiskScore = 0.0;
        }

        return new ReportStatsDto(
            totalTransactions,
            flaggedTransactions,
            totalAlerts,
            resolvedAlerts,
            pendingAlerts,
            totalSARs,
            submittedSARs,
            draftedSARs,
            highRiskCustomers,
            averageRiskScore
        );
    }

    @Override
    public ChartDataDto getAlertsByType(String period) {
        LocalDateTime startDate = period != null ? calculateStartDate(period) : null;

        // Get alert counts by type
        List<Object[]> results = startDate != null 
            ? alertRepository.countAlertsByTypeAfterDate(startDate)
            : alertRepository.countAlertsByType();

        List<String> labels = new ArrayList<>();
        List<Long> values = new ArrayList<>();

        for (Object[] result : results) {
            String type = result[0] != null ? result[0].toString() : "Unknown";
            Long count = ((Number) result[1]).longValue();
            
            // Convert type to friendly label
            labels.add(formatAlertType(type));
            values.add(count);
        }

        return new ChartDataDto(labels, values);
    }

    @Override
    public ChartDataDto getAlertsByStatus(String period) {
        LocalDateTime startDate = period != null ? calculateStartDate(period) : null;

        // Get alert counts by status
        List<Object[]> results = startDate != null
            ? alertRepository.countAlertsByStatusAfterDate(startDate)
            : alertRepository.countAlertsByStatus();

        List<String> labels = new ArrayList<>();
        List<Long> values = new ArrayList<>();

        for (Object[] result : results) {
            String status = result[0] != null ? result[0].toString() : "Unknown";
            Long count = ((Number) result[1]).longValue();
            
            labels.add(formatStatus(status));
            values.add(count);
        }

        return new ChartDataDto(labels, values);
    }

    @Override
    public List<TrendDataDto> getTrends(String period) {
        LocalDateTime startDate = calculateStartDate(period);
        int months = getMonthsFromPeriod(period);

        // Get trend data for alerts, SARs, and transactions
        List<Object[]> alertTrends = alertRepository.getMonthlyTrends(startDate);
        List<Object[]> sarTrends = sarRepository.getMonthlyTrends(startDate);
        List<Object[]> transactionTrends = transactionRepository.getMonthlyTrends(startDate);

        // Create a map to combine all trends by month
        Map<String, TrendDataDto> trendMap = new LinkedHashMap<>();

        // Initialize all months
        LocalDateTime current = startDate;
        for (int i = 0; i < months; i++) {
            String monthKey = current.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            trendMap.put(monthKey, new TrendDataDto(monthKey, 0L, 0L, 0L));
            current = current.plusMonths(1);
        }

        // Fill in alert data
        for (Object[] result : alertTrends) {
            String month = result[1] != null ? result[1].toString() : extractMonthLabel(result);
            Long count = ((Number) result[2]).longValue();
            if (trendMap.containsKey(month)) {
                trendMap.get(month).setAlerts(count);
            }
        }

        // Fill in SAR data
        for (Object[] result : sarTrends) {
            String month = result[1] != null ? result[1].toString() : extractMonthLabel(result);
            Long count = ((Number) result[2]).longValue();
            if (trendMap.containsKey(month)) {
                trendMap.get(month).setSars(count);
            }
        }

        // Fill in transaction data
        for (Object[] result : transactionTrends) {
            String month = result[1] != null ? result[1].toString() : extractMonthLabel(result);
            Long count = ((Number) result[2]).longValue();
            if (trendMap.containsKey(month)) {
                trendMap.get(month).setTransactions(count);
            }
        }

        return new ArrayList<>(trendMap.values());
    }

    private String extractMonthLabel(Object[] result) {
        if (result[0] != null && result[0] instanceof String monthKey && monthKey.length() >= 7) {
            int monthValue = Integer.parseInt(monthKey.substring(monthKey.length() - 2));
            return java.time.Month.of(monthValue).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
        }
        return LocalDateTime.now().getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
    }

    @Override
    public List<TopRiskCustomerDto> getTopRiskCustomers(int limit) {
        List<Object[]> results = customerRepository.findTopRiskCustomers(limit);

        return results.stream().map(result -> {
            Long id = ((Number) result[0]).longValue();
            String name = (String) result[1];
            Integer riskScore = result[2] != null ? ((Number) result[2]).intValue() : 0;
            Long alertCount = result[3] != null ? ((Number) result[3]).longValue() : 0L;
            LocalDateTime lastActivity = (LocalDateTime) result[4];

            return new TopRiskCustomerDto(id, name, riskScore, alertCount, lastActivity);
        }).collect(Collectors.toList());
    }

    private LocalDateTime calculateStartDate(String period) {
        LocalDateTime now = LocalDateTime.now();
        switch (period.toLowerCase()) {
            case "7days":
                return now.minusDays(7);
            case "30days":
                return now.minusDays(30);
            case "90days":
                return now.minusDays(90);
            case "6months":
                return now.minusMonths(6);
            case "1year":
                return now.minusYears(1);
            default:
                return now.minusDays(30);
        }
    }

    private int getMonthsFromPeriod(String period) {
        switch (period.toLowerCase()) {
            case "7days":
            case "30days":
                return 1;
            case "90days":
                return 3;
            case "6months":
                return 6;
            case "1year":
                return 12;
            default:
                return 3;
        }
    }

    private String formatAlertType(String type) {
        if (type == null) return "Unknown";
        
        // Convert RuleType enum to friendly label
        switch (type.toUpperCase()) {
            case "THRESHOLD":
                return "Threshold";
            case "GEOGRAPHIC":
                return "Geographic";
            case "FREQUENCY":
                return "Frequency";
            case "VELOCITY":
                return "Velocity";
            case "PATTERN":
                return "Pattern";
            case "KEYWORD":
                return "Keyword";
            case "FUNNEL":
                return "Funnel";
            default:
                // Handle legacy data or unknown types
                return type.substring(0, 1).toUpperCase() + 
                       type.substring(1).toLowerCase().replace("_", " ");
        }
    }

    private String formatStatus(String status) {
        if (status == null) return "Unknown";
        
        // Format status for display
        return status.substring(0, 1).toUpperCase() + 
               status.substring(1).toLowerCase().replace("_", " ");
    }
}
