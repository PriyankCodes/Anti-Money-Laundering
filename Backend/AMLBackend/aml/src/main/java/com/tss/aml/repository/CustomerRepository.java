package com.tss.aml.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.tss.aml.entity.Customer;
import com.tss.aml.entity.enums.KycStatus;
import com.tss.aml.entity.enums.UserStatus;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    // Add custom queries later if needed, e.g.:
    // Customer findByEmail(String email);
    
    List<Customer> findByKycStatus(KycStatus kycStatus);
    
    long countByKycStatus(KycStatus kycStatus);
    
    // New methods for admin dashboard
    long countByStatus(UserStatus status);
    
    Optional<Customer> findByEmail(String email);
    
    // Reports and Dashboard methods
    @Query("SELECT COUNT(c) FROM Customer c WHERE " +
           "(SELECT AVG(a.riskScore) FROM Alert a WHERE a.customer.userId = c.userId) >= :minRiskScore")
    long countHighRiskCustomers(@Param("minRiskScore") int minRiskScore);
    
    @Query("SELECT AVG(a.riskScore) FROM Alert a")
    Double calculateAverageRiskScore();
    
    @Query("SELECT c.userId, CONCAT(c.firstName, ' ', c.lastName), " +
           "COALESCE(AVG(a.riskScore), 0), " +
           "COUNT(a.alertId), " +
           "MAX(t.timestamp) " +
           "FROM Customer c " +
           "LEFT JOIN Alert a ON a.customer.userId = c.userId " +
           "LEFT JOIN Transaction t ON t.customer.userId = c.userId " +
           "GROUP BY c.userId, c.firstName, c.lastName " +
           "HAVING COALESCE(AVG(a.riskScore), 0) >= 60 " +
           "ORDER BY COALESCE(AVG(a.riskScore), 0) DESC")
    List<Object[]> findTopRiskCustomers(@Param("limit") int limit);
    
    // Phone number uniqueness validation
    Optional<Customer> findByContactNumber(String contactNumber);
    boolean existsByContactNumber(String contactNumber);
    
    // Check if contact number exists excluding current customer
    @Query("SELECT COUNT(c) > 0 FROM Customer c WHERE c.contactNumber = :contactNumber AND c.userId != :userId")
    boolean existsByContactNumberAndUserIdNot(@Param("contactNumber") String contactNumber, @Param("userId") Long userId);

}