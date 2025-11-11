package com.tss.aml.dto.response;

import java.time.LocalDateTime;

public class AdminNotificationDto {
    private Long id;
    private String type;
    private String title;
    private String message;
    private String severity;
    private LocalDateTime timestamp;

    public AdminNotificationDto() {
    }

    public AdminNotificationDto(Long id, String type, String title, String message, String severity, LocalDateTime timestamp) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.message = message;
        this.severity = severity;
        this.timestamp = timestamp;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
