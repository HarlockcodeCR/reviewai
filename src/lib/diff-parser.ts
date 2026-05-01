export interface ParsedDiff {
  // file path -> new line number -> diff position (1-indexed after first @@ in that file)
  positions: Map<string, Map<number, number>>;
  // file path -> list of changed line numbers (additions only)
  changedLines: Map<string, number[]>;
}

/**
 * Parse a unified diff and produce:
 * - positions: used to map (file, line) -> GitHub diff position for inline comments
 * - changedLines: which new-file line numbers were added/modified
 */
export function parseDiff(diff: string): ParsedDiff {
  const positions = new Map<string, Map<number, number>>();
  const changedLines = new Map<string, number[]>();

  // Split on "diff --git" boundaries, skip the empty first element
  const fileDiffs = diff.split(/^diff --git /m).slice(1);

  for (const fileDiff of fileDiffs) {
    // Extract the "b/" path (the new file path)
    const pathMatch = fileDiff.match(/^a\/.+ b\/(.+)\n/);
    if (!pathMatch) continue;
    const path = pathMatch[1].trim();

    const lineMap = new Map<number, number>();
    const added: number[] = [];
    positions.set(path, lineMap);
    changedLines.set(path, added);

    let diffPos = 0;
    let newLineNum = 0;
    let inHunk = false;

    for (const line of fileDiff.split('\n')) {
      if (line.startsWith('@@')) {
        // @@ -oldStart[,oldCount] +newStart[,newCount] @@
        const m = line.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (m) {
          newLineNum = parseInt(m[1], 10) - 1;
          inHunk = true;
          diffPos++;
        }
        continue;
      }

      if (!inHunk) continue;

      if (line.startsWith('+') && !line.startsWith('+++')) {
        newLineNum++;
        diffPos++;
        lineMap.set(newLineNum, diffPos);
        added.push(newLineNum);
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        diffPos++;
      } else if (line.startsWith(' ')) {
        // context line
        newLineNum++;
        diffPos++;
        lineMap.set(newLineNum, diffPos);
      }
    }
  }

  return { positions, changedLines };
}

/** Find the closest diff position for a given file+line, or null if not in diff */
export function getDiffPosition(
  parsed: ParsedDiff,
  filePath: string,
  line: number,
): number | null {
  const fileMap = parsed.positions.get(filePath);
  if (!fileMap) {
    // Try without leading slash or with different separators
    for (const [key, map] of parsed.positions) {
      if (key.endsWith(filePath) || filePath.endsWith(key)) {
        return map.get(line) ?? null;
      }
    }
    return null;
  }
  return fileMap.get(line) ?? null;
}
