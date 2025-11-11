package com.tss.aml.security;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

/**
 * Aspect for handling authorization checks across the application
 */
@Aspect
@Component
public class AuthorizationAspect {

    /**
     * Intercept methods that have customer ID parameters and validate access
     */
    @Before("execution(* com.tss.aml.controller.*.*(.., Long customerId, ..)) && args(.., customerId, ..)")
    public void validateCustomerAccess(JoinPoint joinPoint, Long customerId) {
        SecurityUtils.validateCustomerAccess(customerId);
    }

    /**
     * Intercept account creation methods
     */
    @Before("execution(* com.tss.aml.controller.AccountController.createAccount(Long, ..)) && args(customerId, ..)")
    public void validateAccountCreation(JoinPoint joinPoint, Long customerId) {
        SecurityUtils.validateAccountCreationAccess(customerId);
    }

    /**
     * Intercept admin controller methods
     */
    @Before("execution(* com.tss.aml.controller.AdminController.*(..))")
    public void validateAdminAccess(JoinPoint joinPoint) {
        SecurityUtils.validateAdminAccess();
    }

    /**
     * Intercept compliance officer methods
     */
    @Before("execution(* com.tss.aml.controller.ComplianceOfficerController.*(..))")
    public void validateComplianceAccess(JoinPoint joinPoint) {
        SecurityUtils.validateComplianceAccess();
    }
}
