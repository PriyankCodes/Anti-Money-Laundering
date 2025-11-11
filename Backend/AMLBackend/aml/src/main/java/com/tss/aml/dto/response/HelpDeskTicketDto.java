package com.tss.aml.dto.response;

import java.time.LocalDateTime;

import com.tss.aml.entity.enums.TicketPriority;
import com.tss.aml.entity.enums.TicketStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HelpDeskTicketDto {
	private Long ticketId;
	private Long customerId;
	private String customerName;
	private String subject;
	private String description;
	private TicketStatus status;
	private TicketPriority priority;
	private Long assignedToId;
	private Long alertId;
	private String resolution;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
	private LocalDateTime resolvedAt;

}
