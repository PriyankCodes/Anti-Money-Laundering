export interface Country {
  code: string; // Primary key
  name: string;
  riskLevel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CountryCreateRequest {
  code: string;
  name: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface CountryUpdateRequest {
  code?: string;
  name?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
