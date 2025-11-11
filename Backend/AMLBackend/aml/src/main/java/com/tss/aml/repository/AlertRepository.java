package com.tss.aml.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.tss.aml.entity.Alert;
import com.tss.aml.entity.enums.AlertStatus;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByCustomerUserIdOrderByCreatedAtDesc(Long customerId);
    
    List<Alert> findByAssignedToUserIdOrderByCreatedAtDesc(Long officerId);
    
    // New methods for enhanced alert queries
    List<Alert> findByStatusOrderByCreatedAtDesc(AlertStatus status);
    List<Alert> findByRiskScoreBetweenOrderByRiskScoreDesc(Integer minRiskScore, Integer maxRiskScore);
    
    // Count methods for admin dashboard
    long countByStatus(AlertStatus status);
    long countByRiskScoreGreaterThanEqual(Integer riskScore);
    long countByCustomerUserId(Long customerId);
    
    // Reports and Dashboard methods
    long countByCreatedAtAfter(LocalDateTime startDate);
    
    long countByStatusAndCreatedAtAfter(AlertStatus status, LocalDateTime startDate);
    
    // Group by rule name (old behavior - kept for backward compatibility)
    @Query("SELECT a.ruleTriggered, COUNT(a) FROM Alert a " +
           "WHERE a.createdAt >= :startDate " +
           "GROUP BY a.ruleTriggered ORDER BY COUNT(a) DESC")
    List<Object[]> countAlertsByRuleNameAfterDate(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT a.ruleTriggered, COUNT(a) FROM Alert a " +
           "GROUP BY a.ruleTriggered ORDER BY COUNT(a) DESC")
    List<Object[]> countAlertsByRuleName();
    
    // Group by rule type (new behavior for charts)
    @Query("SELECT a.ruleType, COUNT(a) FROM Alert a " +
           "WHERE a.createdAt >= :startDate AND a.ruleType IS NOT NULL " +
           "GROUP BY a.ruleType ORDER BY COUNT(a) DESC")
    List<Object[]> countAlertsByTypeAfterDate(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT a.ruleType, COUNT(a) FROM Alert a " +
           "WHERE a.ruleType IS NOT NULL " +
           "GROUP BY a.ruleType ORDER BY COUNT(a) DESC")
    List<Object[]> countAlertsByType();
    
    @Query("SELECT a.status, COUNT(a) FROM Alert a " +
           "WHERE a.createdAt >= :startDate " +
           "GROUP BY a.status ORDER BY COUNT(a) DESC")
    List<Object[]> countAlertsByStatusAfterDate(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT a.status, COUNT(a) FROM Alert a " +
           "GROUP BY a.status ORDER BY COUNT(a) DESC")
    List<Object[]> countAlertsByStatus();
    
    @Query("SELECT CONCAT(FUNCTION('YEAR', a.createdAt), '-', LPAD(FUNCTION('MONTH', a.createdAt), 2, '0')) as monthKey, " +
           "       FUNCTION('DATE_FORMAT', MIN(a.createdAt), '%b') as monthLabel, " +
           "       COUNT(a) " +
           "FROM Alert a WHERE a.createdAt >= :startDate " +
           "GROUP BY CONCAT(FUNCTION('YEAR', a.createdAt), '-', LPAD(FUNCTION('MONTH', a.createdAt), 2, '0')) " +
           "ORDER BY monthKey")
    List<Object[]> getMonthlyTrends(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT DATE(a.createdAt) as date, COUNT(a) " +
           "FROM Alert a WHERE a.createdAt >= :startDate " +
           "AND (a.status = 'PENDING' OR a.status = 'UNDER_REVIEW') " +
           "GROUP BY DATE(a.createdAt) ORDER BY DATE(a.createdAt)")
    List<Object[]> getDailyNewAlerts(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT DATE(a.createdAt) as date, COUNT(a) " +
           "FROM Alert a WHERE a.createdAt >= :startDate " +
           "AND a.status = 'RESOLVED' " +
           "GROUP BY DATE(a.createdAt) ORDER BY DATE(a.createdAt)")
    List<Object[]> getDailyResolvedAlerts(@Param("startDate") LocalDateTime startDate);
    
    List<Alert> findTop5ByOrderByCreatedAtDesc();
}