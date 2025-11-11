package com.tss.aml.exception;

/**
 * Custom exception for document verification errors
 */
public class DocumentVerificationException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;
	private final String errorCode;
    
    public DocumentVerificationException(String message) {
        super(message);
        this.errorCode = "DOC_VERIFICATION_ERROR";
    }
    
    public DocumentVerificationException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public DocumentVerificationException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "DOC_VERIFICATION_ERROR";
    }
    
    public DocumentVerificationException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
}
