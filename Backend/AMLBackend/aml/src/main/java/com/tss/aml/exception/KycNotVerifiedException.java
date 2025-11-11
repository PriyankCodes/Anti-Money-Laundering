package com.tss.aml.exception;

public class KycNotVerifiedException extends RuntimeException {
    
    private static final long serialVersionUID = 1L;

	public KycNotVerifiedException(String message) {
        super(message);
    }
    
    public KycNotVerifiedException(String message, Throwable cause) {
        super(message, cause);
    }
}
