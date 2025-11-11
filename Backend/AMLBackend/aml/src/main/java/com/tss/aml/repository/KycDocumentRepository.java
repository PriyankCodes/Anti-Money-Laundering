package com.tss.aml.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tss.aml.entity.KycDocument;
import com.tss.aml.entity.enums.DocumentType;
import com.tss.aml.entity.enums.KycStatus;

@Repository
public interface KycDocumentRepository extends JpaRepository<KycDocument, Long> {
    
    List<KycDocument> findByCustomerUserId(Long customerId);
    
    List<KycDocument> findByCustomerUserIdAndStatus(Long customerId, KycStatus status);
    
    List<KycDocument> findByCustomerUserIdAndDocType(Long customerId, DocumentType docType);
    
    Optional<KycDocument> findByCustomerUserIdAndDocTypeAndStatus(Long customerId, DocumentType docType, KycStatus status);
    
    List<KycDocument> findByStatus(KycStatus status);
    
    @Query("SELECT k FROM KycDocument k WHERE k.uploadTimestamp >= :startDate AND k.uploadTimestamp <= :endDate")
    List<KycDocument> findByUploadDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(k) FROM KycDocument k WHERE k.customer.userId = :customerId AND k.status = 'VERIFIED'")
    long countVerifiedDocumentsByCustomer(@Param("customerId") Long customerId);
    
    @Query("SELECT k FROM KycDocument k WHERE k.verifiedBy.userId = :officerId")
    List<KycDocument> findByVerifiedBy(@Param("officerId") Long officerId);

	List<KycDocument> findByValidatedFalse();

	Long countByStatus(KycStatus pending);
}
