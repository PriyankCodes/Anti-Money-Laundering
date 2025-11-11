export interface AuditLog {
  logId: number;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: number | null;
  userId: number | null;
  username: string | null;
  details: string;
  ipAddress: string;
  userAgent: string | null;
  status: AuditStatus;
  timestamp: string;
}

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_UPDATED = 'ACCOUNT_UPDATED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  TRANSACTION_APPROVED = 'TRANSACTION_APPROVED',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  KYC_UPLOADED = 'KYC_UPLOADED',
  KYC_VERIFIED = 'KYC_VERIFIED',
  KYC_REJECTED = 'KYC_REJECTED',
  RULE_CREATED = 'RULE_CREATED',
  RULE_UPDATED = 'RULE_UPDATED',
  RULE_DELETED = 'RULE_DELETED',
  DATA_VIEWED = 'DATA_VIEWED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET'
}

export enum AuditResourceType {
  USER = 'USER',
  ACCOUNT = 'ACCOUNT',
  TRANSACTION = 'TRANSACTION',
  KYC_DOCUMENT = 'KYC_DOCUMENT',
  RULE = 'RULE',
  AUDIT_LOG = 'AUDIT_LOG',
  SYSTEM = 'SYSTEM'
}

export enum AuditStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PENDING = 'PENDING'
}

export interface AuditLogFilters {
  userSearch: string;
  action: string;
  resourceType: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  sortOrder: 'asc' | 'desc';
}
