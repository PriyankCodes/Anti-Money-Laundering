export interface DashboardStats {
  totalTransactions: number;
  lastLogin: string;
  totalAccounts: number;
  pendingTransactions: number;
}

export interface Transaction {
  id: number;
  description: string;
  type: string;
  date: string;
  amount: number;
  status: 'COMPLETED' | 'BLOCKED' | 'PENDING' | 'FLAGGED';
  fromAccount?: string;
  toAccount?: string;
  receiver?: string;
  receiverName?: string;
  receiverAccountNumber?: string;
  senderAccountNumber?: string;
  country?: string;
  transactionId?: string;
  
  // Additional fields from API response
  timestamp?: string;
  transactionDate?: string;
  accountNumber?: string;
  counterpartyName?: string;
  counterpartyAccount?: string;
  countryCode?: string;
  transactionType?: 'TRANSFER' | 'CREDIT' | 'DEBIT';
  currency?: string;
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  riskScore: number;
}

export interface TransactionCreateRequest {
  senderAccountNumber: string;
  receiverAccountNumber: string;
  amount: number;
  description?: string;
  countryCode?: string;
}

export interface Alert {
  id: number;
  description: string;
  date: string;
  createdAt?: string;
  riskScore: number;
  status: 'OPEN' | 'TRUE POSITIVE' | 'FALSE POSITIVE' | 'RESOLVED';
  transactionId?: number;
}

export interface CustomerProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  lastLogin: string;
}

export interface Account {
  id: number;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  openDate: string;
}
