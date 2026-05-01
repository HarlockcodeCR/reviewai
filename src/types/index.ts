export type ReviewCategory = 'security' | 'performance' | 'style' | 'architecture' | 'bug';
export type ReviewSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ReviewVerdict = 'approve' | 'request_changes' | 'comment';

export interface ReviewIssue {
  file: string;
  line?: number;
  severity: ReviewSeverity;
  category: ReviewCategory;
  comment: string;
  suggestion?: string;
}

export interface ClaudeReviewResult {
  summary: string;
  issues: ReviewIssue[];
  verdict: ReviewVerdict;
}

export interface RepoRules {
  categories: ReviewCategory[];
  minSeverity: ReviewSeverity;
  autoApprove: boolean;
}

export const SEVERITY_ORDER: Record<ReviewSeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

export const FREE_PLAN_LIMIT = 20; // reviews per month
export const PRO_PLAN_LIMIT = 500;
