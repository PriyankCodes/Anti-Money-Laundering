package com.tss.aml;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.entity.Customer;
import com.tss.aml.entity.RiskyCountry;
import com.tss.aml.entity.Rule;
import com.tss.aml.entity.SuspiciousKeyword;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.enums.RiskLevel;
import com.tss.aml.entity.enums.RuleType;
import com.tss.aml.entity.enums.TransactionStatus;
import com.tss.aml.entity.enums.TransactionType;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.RiskyCountryRepository;
import com.tss.aml.repository.RuleRepository;
import com.tss.aml.repository.SuspiciousKeywordRepository;
import com.tss.aml.repository.TransactionRepository;
import com.tss.aml.service.TransactionService;

@SpringBootTest
@Transactional
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class RuleEngineIntegrationTest {

	
	@Autowired
	private TransactionRepository transactionRepo; // 👈 ADD THIS
    @Autowired
    private TransactionService transactionService;

    @Autowired
    private CustomerRepository customerRepo;

    @Autowired
    private RuleRepository ruleRepo;

    @Autowired
    private SuspiciousKeywordRepository keywordRepo;

    @Autowired
    private RiskyCountryRepository riskyCountryRepo;

    private static Customer customer;
    private static final String TEST_EMAIL = "test@example.com";

    @BeforeEach
    void setup() {
        // Clean up any previous test data
        customer = customerRepo.findByEmail(TEST_EMAIL).orElse(null);
        if (customer == null) {
            customer = new Customer(
                TEST_EMAIL, "$2a$10$dummyhash", "John", "Doe",
                LocalDate.of(1990, 1, 1), "US", "+1234567890"
            );
            customer = customerRepo.save(customer);
        }
    }

    @Test
    @Order(1)
    void testThresholdRule() {
        // Arrange
        Rule rule = new Rule(
            "High Amount Rule",
            RuleType.THRESHOLD,
            "{\"amountThreshold\": 10000, \"currency\": \"USD\"}",
            50
        );
        rule.setActive(true);
        ruleRepo.save(rule);

        Transaction tx = new Transaction();
        tx.setCustomer(customer);
        tx.setAmount(new BigDecimal("15000"));
        tx.setCurrency("USD");
        tx.setDescription("Large transfer");
        tx.setTransactionType(TransactionType.TRANSFER);
        tx.setTimestamp(LocalDateTime.now());

        // Act
        Transaction result = transactionService.processTransaction(tx);

        // Assert
        Assertions.assertEquals(TransactionStatus.FLAGGED, result.getStatus());
        System.out.println("✅ Threshold Rule Test PASSED: " + result.getStatus());
    }

    @Test
    @Order(2)
    void testGeographicRule() {
        // Arrange
        riskyCountryRepo.save(new RiskyCountry("PB", "PORBANDAR", RiskLevel.CRITICAL));

        Rule rule = new Rule(
            "High Risk Country Rule",
            RuleType.GEOGRAPHIC,
            "{}", // No params needed - uses RiskyCountry table
            80
        );
        rule.setActive(true);
        ruleRepo.save(rule);

        Transaction tx = new Transaction();
        tx.setCustomer(customer);
        tx.setAmount(new BigDecimal("500"));
        tx.setCurrency("UZ");
        tx.setDescription("Transfer to Uzbekisthan");
        tx.setTransactionType(TransactionType.TRANSFER);
        tx.setCountryCode("PB");
        tx.setTimestamp(LocalDateTime.now());

        // Act
        Transaction result = transactionService.processTransaction(tx);

        // Assert
        Assertions.assertEquals(TransactionStatus.BLOCKED, result.getStatus()); // 80 >= 70
        System.out.println("✅ Geographic Rule Test PASSED: " + result.getStatus());
    }

    @Test
    @Order(3)
    void testKeywordRule() {
        // Arrange
    	// In testKeywordRule():
    	SuspiciousKeyword kw1 = new SuspiciousKeyword("shell", "offshore", 8);
    	kw1.setActive(true);
    	keywordRepo.save(kw1);

    	SuspiciousKeyword kw2 = new SuspiciousKeyword("bribe", "corruption", 10);
    	kw2.setActive(true);
    	keywordRepo.save(kw2);

        Rule rule = new Rule(
            "Suspicious Keyword Rule",
            RuleType.KEYWORD,
            "{}", // Uses all active keywords
            60
        );
        rule.setActive(true);
        ruleRepo.save(rule);

        Transaction tx = new Transaction();
        tx.setCustomer(customer);
        tx.setAmount(new BigDecimal("2000"));
        tx.setCurrency("USD");
        tx.setDescription("Payment to shell company for offshore services");
        tx.setTransactionType(TransactionType.TRANSFER);
        tx.setTimestamp(LocalDateTime.now());

        // Act
        Transaction result = transactionService.processTransaction(tx);

        // Assert
        Assertions.assertEquals(TransactionStatus.FLAGGED, result.getStatus()); // 60 < 70
        System.out.println("✅ Keyword Rule Test PASSED: " + result.getStatus());
    }

    @Test
    @Order(4)
    void testFrequencyRule() {
        // Arrange
        Rule rule = new Rule(
            "High Frequency Rule",
            RuleType.FREQUENCY,
            "{\"maxTransactions\": 3, \"timeWindowMinutes\": 10}",
            75
        );
        rule.setActive(true);
        ruleRepo.save(rule);

        // Create 3 transactions in last 5 minutes
        LocalDateTime now = LocalDateTime.now();
        for (int i = 0; i < 3; i++) {
            Transaction pastTx = new Transaction();
            pastTx.setCustomer(customer);
            pastTx.setAmount(new BigDecimal("1000"));
            pastTx.setCurrency("USD");
            pastTx.setDescription("Frequent transfer " + i);
            pastTx.setTransactionType(TransactionType.TRANSFER);
            pastTx.setTimestamp(now.minusMinutes(5 - i));
            pastTx.setStatus(TransactionStatus.COMPLETED);
            transactionRepo.save(pastTx);        }

        // Now create the 4th transaction
        Transaction tx = new Transaction();
        tx.setCustomer(customer);
        tx.setAmount(new BigDecimal("1000"));
        tx.setCurrency("USD");
        tx.setDescription("Fourth frequent transfer");
        tx.setTransactionType(TransactionType.TRANSFER);
        tx.setTimestamp(now);

        // Act
        Transaction result = transactionService.processTransaction(tx);

        // Assert
        Assertions.assertEquals(TransactionStatus.BLOCKED, result.getStatus()); // 75 >= 70
        System.out.println("✅ Frequency Rule Test PASSED: " + result.getStatus());
    }

    @Test
    @Order(5)
    void testCleanTransaction() {
        // Arrange - no active rules that match
        Transaction tx = new Transaction();
        tx.setCustomer(customer);
        tx.setAmount(new BigDecimal("500"));
        tx.setCurrency("USD");
        tx.setDescription("Normal grocery payment");
        tx.setTransactionType(TransactionType.DEBIT);
        tx.setCountryCode("US");
        tx.setTimestamp(LocalDateTime.now());

        // Act
        Transaction result = transactionService.processTransaction(tx);

        // Assert
        Assertions.assertEquals(TransactionStatus.COMPLETED, result.getStatus());
        System.out.println("✅ Clean Transaction Test PASSED: " + result.getStatus());
    }
}