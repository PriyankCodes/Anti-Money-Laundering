export type RuleType = 'THRESHOLD' | 'GEOGRAPHIC' | 'FREQUENCY' | 'KEYWORD' | 'PATTERN' | 
                     'VELOCITY' | 'FUNNEL_ACCOUNT';

export interface Rule {
  id: number;
  name: string;
  type: RuleType;
  impact: number;
  isActive: boolean;
  description?: string;
  condition?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RuleCreateRequest {
  name: string;
  type: RuleType;
  impact: number;
  description?: string;
  condition?: string;
}

export interface RuleUpdateRequest {
  name?: string;
  type?: RuleType;
  impact?: number;
  isActive?: boolean;
  description?: string;
  condition?: string;
}
