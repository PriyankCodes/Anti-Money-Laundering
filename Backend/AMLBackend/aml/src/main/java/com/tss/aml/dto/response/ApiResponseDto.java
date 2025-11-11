package com.tss.aml.dto.response;

import java.time.LocalDateTime;

public class ApiResponseDto<T> {

	private boolean success;
	private String message;
	private T data;
	private LocalDateTime timestamp;

	// Constructors
	public ApiResponseDto() {
		this.timestamp = LocalDateTime.now();
	}

	public ApiResponseDto(boolean success, String message, T data) {
		this.success = success;
		this.message = message;
		this.data = data;
		this.timestamp = LocalDateTime.now();
	}

	// Static factory methods for common responses
	public static <T> ApiResponseDto<T> success(T data) {
		return new ApiResponseDto<>(true, "Operation completed successfully", data);
	}

	public static <T> ApiResponseDto<T> success(String message, T data) {
		return new ApiResponseDto<>(true, message, data);
	}

	public static <T> ApiResponseDto<T> error(String message) {
		return new ApiResponseDto<>(false, message, null);
	}

	// Getters and Setters
	public boolean isSuccess() {
		return success;
	}

	public void setSuccess(boolean success) {
		this.success = success;
	}

	public String getMessage() {
		return message;
	}

	public void setMessage(String message) {
		this.message = message;
	}

	public T getData() {
		return data;
	}

	public void setData(T data) {
		this.data = data;
	}

	public LocalDateTime getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(LocalDateTime timestamp) {
		this.timestamp = timestamp;
	}
}
