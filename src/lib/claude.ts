import Anthropic from '@anthropic-ai/sdk';
import type { ClaudeReviewResult, RepoRules, ReviewIssue, ReviewCategory } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert code reviewer. Analyze pull request diffs and identify issues across these categories:

- **security**: SQL injection, XSS, hardcoded secrets, insecure dependencies, auth flaws, data exposure
- **performance**: N+1 queries, missing indexes, unnecessary re-renders, blocking I/O, memory leaks
- **style**: naming conventions, dead code, overly complex functions, missing error handling
- **architecture**: SOLID violations, coupling concerns, missing abstractions, scalability issues
- **bug**: logic errors, off-by-one, null pointer risks, race conditions, incorrect assumptions

Be precise and actionable. Only flag real issues—avoid nitpicking. For each issue, provide a clear explanation and a concrete suggestion to fix it.

When you see a diff, lines starting with '+' are additions (new code), '-' are removals. Focus your review on the new code being introduced.`;

const REVIEW_TOOL: Anthropic.Tool = {
  name: 'submit_review',
  description: 'Submit the completed code review results',
  input_schema: {
    type: 'object' as const,
    properties: {
      summary: {
        type: 'string',
        description: 'Overall 2-4 sentence summary of the PR quality and main findings',
      },
      issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            file: { type: 'string', description: 'File path relative to repo root' },
            line: { type: 'number', description: 'Line number in the new version of the file' },
            severity: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low', 'info'],
            },
            category: {
              type: 'string',
              enum: ['security', 'performance', 'style', 'architecture', 'bug'],
            },
            comment: {
              type: 'string',
              description: 'Clear explanation of the issue (1-3 sentences)',
            },
            suggestion: {
              type: 'string',
              description: 'Concrete fix or improvement (optional)',
            },
          },
          required: ['file', 'severity', 'category', 'comment'],
        },
      },
      verdict: {
        type: 'string',
        enum: ['approve', 'request_changes', 'comment'],
        description:
          'approve if no significant issues, request_changes if critical/high issues found, comment otherwise',
      },
    },
    required: ['summary', 'issues', 'verdict'],
  },
};

export async function reviewPullRequest(
  diff: string,
  prTitle: string,
  prDescription: string,
  rules: RepoRules,
): Promise<ClaudeReviewResult & { tokensUsed: number }> {
  const enabledCategories = rules.categories.join(', ');

  const userMessage = `Please review this pull request.

**PR Title:** ${prTitle}
**PR Description:** ${prDescription || '(none)'}
**Review focus:** ${enabledCategories}

**Diff:**
\`\`\`diff
${diff.slice(0, 80_000)} ${diff.length > 80_000 ? '\n\n[diff truncated — showing first 80k chars]' : ''}
\`\`\`

Only flag issues in these categories: ${enabledCategories}.
Only include issues with severity >= ${rules.minSeverity}.`;

  // Use prompt caching beta for the static system prompt
  const rawResponse = await anthropic.beta.promptCaching.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [REVIEW_TOOL],
    tool_choice: { type: 'tool', name: 'submit_review' },
    messages: [{ role: 'user', content: userMessage }],
  });

  // beta.promptCaching returns a PromptCachingBetaMessage; cast to access standard fields
  const response = rawResponse as unknown as Anthropic.Message;

  const toolUse = response.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return a review tool call');
  }

  const result = toolUse.input as ClaudeReviewResult;

  const allowed = new Set<ReviewCategory>(rules.categories);
  result.issues = result.issues.filter((i) => allowed.has(i.category as ReviewCategory));

  const severityRank: Record<string, number> = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    info: 1,
  };
  const minRank = severityRank[rules.minSeverity] ?? 1;
  result.issues = result.issues.filter((i) => (severityRank[i.severity] ?? 1) >= minRank);

  if (rules.autoApprove && result.issues.length === 0) {
    result.verdict = 'approve';
  }

  return {
    ...result,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}

export function formatIssueComment(issue: ReviewIssue): string {
  const severityEmoji: Record<string, string> = {
    critical: '🚨',
    high: '⚠️',
    medium: '🔶',
    low: '💡',
    info: 'ℹ️',
  };
  const categoryLabel: Record<string, string> = {
    security: 'Security',
    performance: 'Performance',
    style: 'Code Style',
    architecture: 'Architecture',
    bug: 'Bug',
  };

  const emoji = severityEmoji[issue.severity] ?? '💬';
  const label = categoryLabel[issue.category] ?? issue.category;
  const severity = issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1);

  let body = `${emoji} **[${severity}] ${label}**\n\n${issue.comment}`;
  if (issue.suggestion) {
    body += `\n\n**Suggested fix:**\n${issue.suggestion}`;
  }
  body += `\n\n<sub>Reviewed by [ReviewAI](${process.env.NEXT_PUBLIC_APP_URL})</sub>`;
  return body;
}
