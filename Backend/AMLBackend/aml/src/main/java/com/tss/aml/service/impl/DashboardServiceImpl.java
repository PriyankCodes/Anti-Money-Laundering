package com.tss.aml.service.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.response.AlertTrendDto;
import com.tss.aml.dto.response.ChartDataDto;
import com.tss.aml.dto.response.DashboardStatsDto;
import com.tss.aml.dto.response.RecentActivityDto;
import com.tss.aml.entity.Alert;
import com.tss.aml.entity.Sar;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.enums.AlertStatus;
import com.tss.aml.entity.enums.TicketStatus;
import com.tss.aml.entity.enums.UserRole;
import com.tss.aml.repository.AccountRepository;
import com.tss.aml.repository.AlertRepository;
import com.tss.aml.repository.HelpDeskTicketRepository;
import com.tss.aml.repository.SarRepository;
import com.tss.aml.repository.TransactionRepository;
import com.tss.aml.repository.UserRepository;
import com.tss.aml.service.DashboardService;

@Service
public class DashboardServiceImpl implements DashboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private SarRepository sarRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private HelpDeskTicketRepository helpDeskTicketRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Override
    public DashboardStatsDto getDashboardStats() {
        DashboardStatsDto stats = new DashboardStatsDto();

        // Count users by role
        stats.setTotalUsers(userRepository.count());
        stats.setTotalCustomers(userRepository.countByRole(UserRole.CUSTOMER));
        stats.setTotalOfficers(userRepository.countByRole(UserRole.COMPLIANCE_OFFICER));

        // Count alerts
        stats.setTotalAlerts(alertRepository.count());
        stats.setPendingAlerts(alertRepository.countByStatus(AlertStatus.OPEN));

        // Count SARs
        stats.setTotalSARs(sarRepository.count());

        // Count active accounts
        stats.setActiveAccounts(accountRepository.countActiveAccounts());

        // Count open help tickets
        stats.setOpenHelpTickets(helpDeskTicketRepository.countByStatus(TicketStatus.OPEN));

        return stats;
    }

    @Override
    public AlertTrendDto getAlertTrend(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        
        List<Object[]> newAlerts = alertRepository.getDailyNewAlerts(startDate);
        List<Object[]> resolvedAlerts = alertRepository.getDailyResolvedAlerts(startDate);

        // Create date labels
        List<String> labels = new ArrayList<>();
        Map<String, Long> newAlertsMap = new LinkedHashMap<>();
        Map<String, Long> resolvedAlertsMap = new LinkedHashMap<>();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d");
        
        // Initialize all days with 0
        for (int i = days - 1; i >= 0; i--) {
            LocalDateTime date = LocalDateTime.now().minusDays(i);
            String label = date.format(formatter);
            labels.add(label);
            newAlertsMap.put(label, 0L);
            resolvedAlertsMap.put(label, 0L);
        }

        // Fill in new alerts data
        for (Object[] result : newAlerts) {
            LocalDateTime date = (LocalDateTime) result[0];
            Long count = ((Number) result[1]).longValue();
            String label = date.format(formatter);
            newAlertsMap.put(label, count);
        }

        // Fill in resolved alerts data
        for (Object[] result : resolvedAlerts) {
            LocalDateTime date = (LocalDateTime) result[0];
            Long count = ((Number) result[1]).longValue();
            String label = date.format(formatter);
            resolvedAlertsMap.put(label, count);
        }

        // Create datasets
        List<AlertTrendDto.DatasetDto> datasets = new ArrayList<>();
        datasets.add(new AlertTrendDto.DatasetDto(
            "New Alerts",
            new ArrayList<>(newAlertsMap.values()),
            "#3b82f6"
        ));
        datasets.add(new AlertTrendDto.DatasetDto(
            "Resolved Alerts",
            new ArrayList<>(resolvedAlertsMap.values()),
            "#10b981"
        ));

        return new AlertTrendDto(labels, datasets);
    }

    @Override
    public AlertTrendDto getTransactionVolume(int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        
        List<Object[]> allTransactions = transactionRepository.getDailyTransactionCounts(startDate);
        List<Object[]> flaggedTransactions = transactionRepository.getDailyFlaggedTransactionCounts(startDate);

        // Create date labels
        List<String> labels = new ArrayList<>();
        Map<String, Long> allTransactionsMap = new LinkedHashMap<>();
        Map<String, Long> flaggedTransactionsMap = new LinkedHashMap<>();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM d");
        
        // Initialize all days with 0
        for (int i = days - 1; i >= 0; i--) {
            LocalDateTime date = LocalDateTime.now().minusDays(i);
            String label = date.format(formatter);
            labels.add(label);
            allTransactionsMap.put(label, 0L);
            flaggedTransactionsMap.put(label, 0L);
        }

        // Fill in all transactions data
        for (Object[] result : allTransactions) {
            LocalDateTime date = (LocalDateTime) result[0];
            Long count = ((Number) result[1]).longValue();
            String label = date.format(formatter);
            allTransactionsMap.put(label, count);
        }

        // Fill in flagged transactions data
        for (Object[] result : flaggedTransactions) {
            LocalDateTime date = (LocalDateTime) result[0];
            Long count = ((Number) result[1]).longValue();
            String label = date.format(formatter);
            flaggedTransactionsMap.put(label, count);
        }

        // Create datasets
        List<AlertTrendDto.DatasetDto> datasets = new ArrayList<>();
        datasets.add(new AlertTrendDto.DatasetDto(
            "Transaction Count",
            new ArrayList<>(allTransactionsMap.values()),
            "#3b82f6"
        ));
        datasets.add(new AlertTrendDto.DatasetDto(
            "Flagged Transactions",
            new ArrayList<>(flaggedTransactionsMap.values()),
            "#ef4444"
        ));

        return new AlertTrendDto(labels, datasets);
    }

    @Override
    public ChartDataDto getRiskDistribution() {
        List<Object[]> results = userRepository.getRiskDistribution();

        List<String> labels = Arrays.asList("Low Risk", "Medium Risk", "High Risk", "Critical Risk");
        List<Long> values = new ArrayList<>();
        List<String> colors = Arrays.asList("#10b981", "#f59e0b", "#f97316", "#ef4444");

        // Initialize with zeros
        for (int i = 0; i < 4; i++) {
            values.add(0L);
        }

        // Fill in actual values
        for (Object[] result : results) {
            String riskLevel = result[0] != null ? result[0].toString() : "Unknown";
            Long count = ((Number) result[1]).longValue();

            int index = labels.indexOf(riskLevel);
            if (index >= 0) {
                values.set(index, count);
            }
        }

        return new ChartDataDto(labels, values, colors);
    }

    @Override
    public List<RecentActivityDto> getRecentActivities(int limit) {
        List<RecentActivityDto> activities = new ArrayList<>();

        // Get recent alerts
        List<Alert> recentAlerts = alertRepository.findTop5ByOrderByCreatedAtDesc();
        for (Alert alert : recentAlerts) {
            if (activities.size() >= limit) break;
            
            RecentActivityDto activity = new RecentActivityDto();
            activity.setId(alert.getAlertId());
            activity.setType("alert");
            activity.setTitle(formatAlertTitle(alert));
            activity.setDescription(alert.getRuleTriggered() != null ? alert.getRuleTriggered() : "Alert flagged for review");
            activity.setTimestamp(alert.getCreatedAt());
            activity.setSeverity(getSeverityFromRiskScore(alert.getRiskScore()));
            activity.setUser(alert.getCustomer() != null ? 
                alert.getCustomer().getFirstName() + " " + alert.getCustomer().getLastName() : "Unknown");
            activities.add(activity);
        }

        // Get recent SARs
        List<Sar> recentSARs = sarRepository.findTop5ByOrderByCreatedAtDesc();
        for (Sar sar : recentSARs) {
            if (activities.size() >= limit) break;
            
            RecentActivityDto activity = new RecentActivityDto();
            activity.setId(sar.getSarId());
            activity.setType("sar");
            activity.setTitle("SAR " + (sar.getStatus() != null ? sar.getStatus().toString() : "Created"));
            activity.setDescription("SAR #" + sar.getSarId() + " - " + 
                (sar.getStatus() != null ? sar.getStatus().toString() : "Draft"));
            activity.setTimestamp(sar.getCreatedAt());
            activity.setSeverity("info");
            activity.setUser(sar.getOfficer() != null ? 
                sar.getOfficer().getFirstName() + " " + sar.getOfficer().getLastName() : "System");
            activities.add(activity);
        }

        // Get recent high-value transactions
        List<Transaction> recentTransactions = transactionRepository.findTop5HighValueTransactions();
        for (Transaction transaction : recentTransactions) {
            if (activities.size() >= limit) break;
            
            RecentActivityDto activity = new RecentActivityDto();
            activity.setId(transaction.getTransactionId());
            activity.setType("transaction");
            activity.setTitle("High Value Transaction");
            activity.setDescription("Transaction of " + transaction.getCurrency() + " " + 
                transaction.getAmount() + " - " + transaction.getTransactionType());
            activity.setTimestamp(transaction.getTimestamp());
            activity.setSeverity(transaction.getStatus() != null ? "high" : "info");
            activity.setUser(transaction.getCustomer() != null ? 
                transaction.getCustomer().getFirstName() + " " + transaction.getCustomer().getLastName() : "Unknown");
            activities.add(activity);
        }

        // Sort by timestamp descending and limit
        return activities.stream()
            .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
            .limit(limit)
            .collect(Collectors.toList());
    }

    private String formatAlertTitle(Alert alert) {
        if (alert.getRuleTriggered() != null && !alert.getRuleTriggered().isEmpty()) {
            return alert.getRuleTriggered() + " Alert";
        }
        return "Transaction Alert";
    }

    private String getSeverityFromRiskScore(Integer riskScore) {
        if (riskScore == null) return "info";
        if (riskScore >= 80) return "critical";
        if (riskScore >= 60) return "high";
        if (riskScore >= 40) return "medium";
        return "low";
    }
}
