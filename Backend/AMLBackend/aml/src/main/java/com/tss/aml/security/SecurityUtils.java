package com.tss.aml.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.tss.aml.entity.User;
import com.tss.aml.entity.enums.UserRole;

/**
 * Utility class for security-related operations
 */
@Component
public class SecurityUtils {

    /**
     * Get the currently authenticated user
     */
    public static User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        throw new SecurityException("No authenticated user found");
    }

    /**
     * Get the current user's ID
     */
    public static Long getCurrentUserId() {
        return getCurrentUser().getUserId();
    }

    /**
     * Get the current user's email
     */
    public static String getCurrentUserEmail() {
        return getCurrentUser().getEmail();
    }

    /**
     * Get the current user's role
     */
    public static UserRole getCurrentUserRole() {
        return getCurrentUser().getRole();
    }

    /**
     * Check if the current user is an admin
     */
    public static boolean isCurrentUserAdmin() {
        return getCurrentUserRole() == UserRole.ADMIN;
    }

    /**
     * Check if the current user is a compliance officer
     */
    public static boolean isCurrentUserComplianceOfficer() {
        return getCurrentUserRole() == UserRole.COMPLIANCE_OFFICER;
    }

    /**
     * Check if the current user is a customer
     */
    public static boolean isCurrentUserCustomer() {
        return getCurrentUserRole() == UserRole.CUSTOMER;
    }

    /**
     * Validate that the current user can access data for the specified customer ID
     * Customers can only access their own data
     * Admins and Compliance Officers can access any customer data
     */
    public static void validateCustomerAccess(Long customerId) {
        User currentUser = getCurrentUser();
        
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            if (!currentUser.getUserId().equals(customerId)) {
                throw new SecurityException("Access denied: You can only access your own data");
            }
        }
        // Admins and Compliance Officers can access any customer data
    }

    /**
     * Validate that the current user can perform admin operations
     */
    public static void validateAdminAccess() {
        if (!isCurrentUserAdmin()) {
            throw new SecurityException("Access denied: Admin privileges required");
        }
    }

    /**
     * Validate that the current user can perform compliance operations
     */
    public static void validateComplianceAccess() {
        UserRole role = getCurrentUserRole();
        if (role != UserRole.ADMIN && role != UserRole.COMPLIANCE_OFFICER) {
            throw new SecurityException("Access denied: Compliance privileges required");
        }
    }

    /**
     * Check if the current user has authentication
     */
    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() 
               && authentication.getPrincipal() instanceof User;
    }

    /**
     * Validate that a user can only create accounts for themselves (if customer)
     */
    public static void validateAccountCreationAccess(Long targetCustomerId) {
        User currentUser = getCurrentUser();
        
        if (currentUser.getRole() == UserRole.CUSTOMER) {
            if (!currentUser.getUserId().equals(targetCustomerId)) {
                throw new SecurityException("Access denied: Customers can only create accounts for themselves");
            }
        }
        // Admins can create accounts for any customer
    }

    /**
     * Validate transaction access - users can only view their own transactions
     */
    public static void validateTransactionAccess(Long customerId) {
        validateCustomerAccess(customerId);
    }

    /**
     * Validate alert access - users can only view their own alerts
     */
    public static void validateAlertAccess(Long customerId) {
        validateCustomerAccess(customerId);
    }
}
