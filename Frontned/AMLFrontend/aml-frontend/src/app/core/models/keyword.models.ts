export interface Keyword {
  id?: number;
  keyword: string;
  category: string;
  severity: number; // 0-10 scale
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface KeywordCreateRequest {
  keyword: string;
  category: string;
  severity: number; // 0-10 scale
  description?: string;
}

export interface KeywordUpdateRequest {
  keyword?: string;
  category?: string;
  severity?: number; // 0-10 scale
  description?: string;
  isActive?: boolean;
}
