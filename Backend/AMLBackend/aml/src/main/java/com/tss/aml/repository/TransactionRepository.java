package com.tss.aml.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.tss.aml.entity.Account;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.enums.TransactionStatus;
import com.tss.aml.entity.enums.TransactionType;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // Count transactions for a customer after a given timestamp
    long countByCustomerUserIdAndTimestampAfter(Long userId, LocalDateTime timestamp);

    // Find amounts for a customer after timestamp and below a certain amount
    @Query("SELECT t.amount FROM Transaction t WHERE t.customer.userId = :customerId AND t.timestamp > :timestamp AND t.amount < :amount")
    List<BigDecimal> findAmountsByCustomerIdAndTimestampAfterAndAmountLessThan(
            @Param("customerId") Long customerId,
            @Param("timestamp") LocalDateTime timestamp,
            @Param("amount") BigDecimal amount);

    // Find transactions by sender account number
    @Query("SELECT t FROM Transaction t WHERE t.senderAccountNumber = :senderAccountNumber")
    List<Transaction> findBySenderAccountNumber(@Param("senderAccountNumber") String senderAccountNumber);

    // Find transactions for a customer
    List<Transaction> findByCustomerUserId(Long customerId);

    // Count transactions with type and minimum amount
    long countByCustomerUserIdAndTimestampAfterAndTransactionTypeAndAmountGreaterThanEqual(
            Long userId, LocalDateTime timestamp, TransactionType type, BigDecimal amount);

    // List transactions for a customer ordered by timestamp
    List<Transaction> findByCustomerUserIdOrderByTimestampDesc(Long customerId);

    // Find transaction by transactionId and customer
    Transaction findByTransactionIdAndCustomerUserId(Long transactionId, Long customerId);

    // Find transactions for a customer filtered by status
    List<Transaction> findByCustomerUserIdAndStatusInOrderByTimestampDesc(Long customerId, List<TransactionStatus> statuses);

    // Count transactions for a customer
    long countByCustomerUserId(Long customerId);

    // Count transactions for a customer filtered by status
    long countByCustomerUserIdAndStatus(Long customerId, TransactionStatus status);
    
 // TransactionRepository.java

    
    @Query("SELECT COUNT(DISTINCT t.customer.userId) FROM Transaction t " +
    	       "WHERE t.counterpartyAccount = :receiverAccount " +
    	       "AND t.timestamp > :after " +
    	       "AND t.transactionType IN (com.tss.aml.entity.enums.TransactionType.DEBIT, com.tss.aml.entity.enums.TransactionType.TRANSFER)")
    	long countDistinctSendersToReceiverAfter(@Param("receiverAccount") String receiverAccount, @Param("after") LocalDateTime after);

    // Reports and Dashboard methods
    long countByTimestampAfter(LocalDateTime startDate);
    
    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.timestamp >= :startDate " +
           "AND (t.status = 'FLAGGED' OR EXISTS (SELECT a FROM Alert a WHERE a.transaction.transactionId = t.transactionId))")
    long countFlaggedTransactionsAfter(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT CONCAT(FUNCTION('YEAR', t.timestamp), '-', LPAD(FUNCTION('MONTH', t.timestamp), 2, '0')) as monthKey, " +
           "       FUNCTION('DATE_FORMAT', MIN(t.timestamp), '%b') as monthLabel, " +
           "       COUNT(t) " +
           "FROM Transaction t WHERE t.timestamp >= :startDate " +
           "GROUP BY CONCAT(FUNCTION('YEAR', t.timestamp), '-', LPAD(FUNCTION('MONTH', t.timestamp), 2, '0')) " +
           "ORDER BY monthKey")
    List<Object[]> getMonthlyTrends(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT DATE(t.timestamp) as date, COUNT(t) " +
           "FROM Transaction t WHERE t.timestamp >= :startDate " +
           "GROUP BY DATE(t.timestamp) ORDER BY DATE(t.timestamp)")
    List<Object[]> getDailyTransactionCounts(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT DATE(t.timestamp) as date, COUNT(t) " +
           "FROM Transaction t WHERE t.timestamp >= :startDate " +
           "AND (t.status = 'FLAGGED' OR EXISTS (SELECT a FROM Alert a WHERE a.transaction.transactionId = t.transactionId)) " +
           "GROUP BY DATE(t.timestamp) ORDER BY DATE(t.timestamp)")
    List<Object[]> getDailyFlaggedTransactionCounts(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT t FROM Transaction t WHERE t.amount >= 10000 " +
           "ORDER BY t.timestamp DESC")
    List<Transaction> findTop5HighValueTransactions();

    // Find all transactions with customer data eagerly loaded
    @Query("SELECT t FROM Transaction t LEFT JOIN FETCH t.customer ORDER BY t.transactionId DESC")
    List<Transaction> findAllWithCustomer();
    
    @Query("SELECT AVG(t.amount) FROM Transaction t WHERE t.customer.userId = :userId AND t.timestamp >= :since")
    BigDecimal findAverageAmount(Long userId, LocalDateTime since);

    @Query("SELECT MAX(t.timestamp) FROM Transaction t WHERE t.customer.userId = :userId")
    LocalDateTime findLastTransactionTime(Long userId);

    @Query("SELECT t FROM Transaction t WHERE t.customer.userId = :userId AND t.timestamp >= :cutoff ORDER BY t.timestamp DESC")
    List<Transaction> findRecentTransactions(@Param("userId") Long userId, @Param("cutoff") LocalDateTime cutoff);

    @Query("SELECT COALESCE(SUM(CASE WHEN t.transactionType = 'CREDIT' THEN t.amount ELSE -t.amount END), 0) "
    	     + "FROM Transaction t WHERE t.customer.userId = :userId")
    	BigDecimal findCurrentBalance(Long userId);

    // Sum transaction amounts for cumulative velocity checks
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t " +
           "WHERE t.customer.userId = :userId " +
           "AND t.timestamp > :cutoff " +
           "AND t.timestamp <= :endTime " +
           "AND t.transactionType IN (com.tss.aml.entity.enums.TransactionType.DEBIT, com.tss.aml.entity.enums.TransactionType.TRANSFER)")
    BigDecimal sumAmountByCustomerAndTimeWindow(@Param("userId") Long userId, 
                                                  @Param("cutoff") LocalDateTime cutoff,
                                                  @Param("endTime") LocalDateTime endTime);

}
