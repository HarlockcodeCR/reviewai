import { Octokit } from '@octokit/rest';
import { prisma } from './prisma';
import { parseDiff, getDiffPosition } from './diff-parser';
import { reviewPullRequest, formatIssueComment } from './claude';
import type { ClaudeReviewResult, RepoRules } from '@/types';
import type { Repo, Review } from '@prisma/client';

export function makeOctokit(token: string) {
  return new Octokit({ auth: token });
}

/** Fetch the raw unified diff for a PR */
export async function getPRDiff(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<string> {
  const response = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
    owner,
    repo,
    pull_number: pullNumber,
    headers: { accept: 'application/vnd.github.diff' },
  });
  return response.data as unknown as string;
}

/** Post a review with inline comments where possible, body-only fallback otherwise */
export async function postGitHubReview(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  headSha: string,
  result: ClaudeReviewResult,
  diff: string,
): Promise<number> {
  const parsed = parseDiff(diff);

  type ReviewComment = {
    path: string;
    body: string;
    position?: number;
    line?: number;
    side?: 'RIGHT' | 'LEFT';
  };

  const inlineComments: ReviewComment[] = [];
  const fallbackLines: string[] = [];

  for (const issue of result.issues) {
    const body = formatIssueComment(issue);

    if (issue.line && issue.file) {
      // Try diff position first, then fall back to line+side
      const diffPos = getDiffPosition(parsed, issue.file, issue.line);
      if (diffPos !== null) {
        inlineComments.push({ path: issue.file, position: diffPos, body });
      } else {
        // Use line+side (works for lines in the diff even without position mapping)
        inlineComments.push({ path: issue.file, line: issue.line, side: 'RIGHT', body });
      }
    } else if (issue.file) {
      fallbackLines.push(`**\`${issue.file}\`**\n${body}`);
    } else {
      fallbackLines.push(body);
    }
  }

  const eventMap: Record<string, 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT'> = {
    approve: 'APPROVE',
    request_changes: 'REQUEST_CHANGES',
    comment: 'COMMENT',
  };
  const event = eventMap[result.verdict] ?? 'COMMENT';

  let body = `## ReviewAI Analysis\n\n${result.summary}`;
  if (fallbackLines.length > 0) {
    body += `\n\n---\n\n### Additional Notes\n\n${fallbackLines.join('\n\n---\n\n')}`;
  }

  // GitHub rejects REQUEST_CHANGES from the repo owner on their own PR, use COMMENT instead
  let reviewEvent = event;
  try {
    const pr = await octokit.pulls.get({ owner, repo, pull_number: pullNumber });
    // If reviewer is the PR author, downgrade REQUEST_CHANGES to COMMENT
    if (event === 'REQUEST_CHANGES') {
      const authUser = await octokit.users.getAuthenticated();
      if (authUser.data.login === pr.data.user?.login) {
        reviewEvent = 'COMMENT';
      }
    }
  } catch {
    // Non-fatal — proceed with original event
  }

  // Try with inline comments first; if GitHub rejects any position, fall back to body-only
  let review;
  try {
    review = await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      commit_id: headSha,
      body,
      event: reviewEvent,
      comments: inlineComments,
    });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 422 && inlineComments.length > 0) {
      // One or more positions couldn't be resolved — post without inline comments
      review = await octokit.pulls.createReview({
        owner,
        repo,
        pull_number: pullNumber,
        commit_id: headSha,
        body,
        event: reviewEvent,
        comments: [],
      });
    } else {
      throw err;
    }
  }

  return review.data.id;
}

/** Full pipeline: fetch diff → Claude review → post to GitHub → update DB */
export async function runReview(
  dbReview: Review & { repo: Repo & { user: { githubAccessToken: string | null } } },
): Promise<void> {
  const [owner, repoName] = dbReview.repo.fullName.split('/');

  const token = dbReview.repo.user.githubAccessToken;
  if (!token) {
    throw new Error('No GitHub token found for user');
  }

  const octokit = makeOctokit(token);

  // Mark as in-progress
  await prisma.review.update({
    where: { id: dbReview.id },
    data: { status: 'pending' },
  });

  // Fetch the PR details
  const pr = await octokit.pulls.get({
    owner,
    repo: repoName,
    pull_number: dbReview.prNumber,
  });

  const headSha = pr.data.head.sha;
  const prTitle = pr.data.title;
  const prBody = pr.data.body ?? '';

  // Fetch the diff
  const diff = await getPRDiff(octokit, owner, repoName, dbReview.prNumber);

  if (!diff || diff.trim().length === 0) {
    await prisma.review.update({
      where: { id: dbReview.id },
      data: { status: 'skipped', summary: 'Empty diff — nothing to review.' },
    });
    return;
  }

  // Run Claude review
  const rules = (dbReview.repo.rules as unknown as RepoRules) ?? {
    categories: ['security', 'performance', 'style', 'architecture'],
    minSeverity: 'low',
    autoApprove: false,
  };

  const result = await reviewPullRequest(diff, prTitle, prBody, rules);

  // Post to GitHub
  const githubReviewId = await postGitHubReview(
    octokit,
    owner,
    repoName,
    dbReview.prNumber,
    headSha,
    result,
    diff,
  );

  const criticalCount = result.issues.filter((i) => i.severity === 'critical').length;

  // Update review record
  await prisma.review.update({
    where: { id: dbReview.id },
    data: {
      status: 'completed',
      summary: result.summary,
      verdict: result.verdict,
      issueCount: result.issues.length,
      criticalCount,
      tokensUsed: result.tokensUsed,
      headSha,
      prTitle,
      completedAt: new Date(),
    },
  });

  // Increment usage counter
  await prisma.user.update({
    where: { id: dbReview.repo.userId },
    data: { reviewsThisMonth: { increment: 1 } },
  });
}

/** Register a webhook on a repo */
export async function registerWebhook(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<number> {
  const hook = await octokit.repos.createWebhook({
    owner,
    repo,
    config: {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`,
      content_type: 'json',
      secret: process.env.GITHUB_WEBHOOK_SECRET!,
    },
    events: ['pull_request'],
    active: true,
  });
  return hook.data.id;
}

/** Remove a webhook from a repo */
export async function deleteWebhook(
  octokit: Octokit,
  owner: string,
  repo: string,
  hookId: number,
): Promise<void> {
  await octokit.repos.deleteWebhook({ owner, repo, hook_id: hookId });
}
