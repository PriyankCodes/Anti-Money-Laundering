package com.tss.aml.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.tss.aml.entity.User;
import com.tss.aml.entity.enums.UserRole;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    
    Optional<User> findByEmailIgnoreCase(String email);
    
    // Dashboard methods
    long countByRole(UserRole role);
    
    @Query(value = "SELECT bucket, COUNT(*) AS total "
                 + "FROM ("
                 + "    SELECT CASE"
                 + "             WHEN COALESCE(AVG(a.risk_score), 0) < 40 THEN 'Low Risk'"
                 + "             WHEN COALESCE(AVG(a.risk_score), 0) < 60 THEN 'Medium Risk'"
                 + "             WHEN COALESCE(AVG(a.risk_score), 0) < 80 THEN 'High Risk'"
                 + "             ELSE 'Critical Risk'"
                 + "         END AS bucket"
                 + "    FROM customers c"
                 + "    LEFT JOIN alerts a ON a.customer_id = c.user_id"
                 + "    GROUP BY c.user_id"
                 + ") risk_summary "
                 + "GROUP BY bucket",
           nativeQuery = true)
    List<Object[]> getRiskDistribution();
}