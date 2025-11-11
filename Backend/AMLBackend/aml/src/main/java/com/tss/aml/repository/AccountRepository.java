package com.tss.aml.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.tss.aml.entity.Account;
import com.tss.aml.entity.Customer;

public interface AccountRepository extends JpaRepository<Account, Long> {
	Account findByAccountNumber(String accountNumber);

	boolean existsByAccountNumber(String accountNumber);

	@Query(value = "SELECT * FROM accounts WHERE customer_id = :customerId", nativeQuery = true)
	List<Account> findByCustomerUserId(@Param("customerId") Long customerId);
	
	// Find all accounts for a customer
	List<Account> findByCustomer(Customer customer);
	
	@Query("SELECT COUNT(a) FROM Account a WHERE a.status = 'ACTIVE'")
	long countActiveAccounts();
}