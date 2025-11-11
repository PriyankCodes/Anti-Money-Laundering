package com.tss.aml.exception;

public class UserApiException extends RuntimeException {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public UserApiException(String message) {
		super(message);
	}

	public UserApiException(String message, Throwable cause) {
		super(message, cause);
	}
}
