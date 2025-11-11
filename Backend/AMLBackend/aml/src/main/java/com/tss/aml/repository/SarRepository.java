package com.tss.aml.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.tss.aml.entity.Sar;
import com.tss.aml.entity.Sar.SarStatus;

public interface SarRepository extends JpaRepository<Sar, Long> {
    List<Sar> findAllByOrderByCreatedAtDesc();
    
    // Check if SAR already exists for an alert
    boolean existsByAlert_AlertId(Long alertId);
    
    // Reports and Dashboard methods
    long countByCreatedAtAfter(LocalDateTime startDate);
    
    long countByStatusAndCreatedAtAfter(SarStatus status, LocalDateTime startDate);
    
    @Query("SELECT CONCAT(FUNCTION('YEAR', s.createdAt), '-', LPAD(FUNCTION('MONTH', s.createdAt), 2, '0')) as monthKey, " +
           "       FUNCTION('DATE_FORMAT', MIN(s.createdAt), '%b') as monthLabel, " +
           "       COUNT(s) " +
           "FROM Sar s WHERE s.createdAt >= :startDate " +
           "GROUP BY CONCAT(FUNCTION('YEAR', s.createdAt), '-', LPAD(FUNCTION('MONTH', s.createdAt), 2, '0')) " +
           "ORDER BY monthKey")
    List<Object[]> getMonthlyTrends(@Param("startDate") LocalDateTime startDate);
    
    List<Sar> findTop5ByOrderByCreatedAtDesc();
}