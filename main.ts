import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// Two Lines to Your Past Self: a warning about one concrete moment, then
// one sentence on what that moment cost. The program reads the two lines
// from two-lines.txt, checks them against the bounty gate (exactly two
// lines, each a single sentence, 1-280 characters total, no stray
// whitespace), prints them, and saves them to /output/entry.txt — the
// sealed scorer only ever reads that file, so stdout alone would score 0.
const GATE_MAX_CHARS = 280;

function loadLines(): string[] {
  const raw = readFileSync(new URL("./two-lines.txt", import.meta.url), "utf8");
  const body = raw.endsWith("\n") ? raw.slice(0, -1) : raw;
  return body.split("\n");
}

function sentenceMarks(line: string): number {
  return (line.match(/[.!?]/g) ?? []).length;
}

function collectProblems(lines: string[]): string[] {
  const problems: string[] = [];
  const joined = lines.join("\n");
  if (lines.length !== 2) problems.push(`expected exactly 2 lines, found ${lines.length}`);
  if (joined.length < 1) problems.push("entry is empty");
  if (joined.length > GATE_MAX_CHARS) problems.push(`entry is ${joined.length} characters, over the ${GATE_MAX_CHARS} cap`);
  if (joined.includes("\r")) problems.push("carriage returns are not allowed");
  for (const [index, line] of lines.entries()) {
    const n = index + 1;
    if (line.length === 0) problems.push(`line ${n} is empty`);
    if (line !== line.trim()) problems.push(`line ${n} has leading or trailing whitespace`);
    if (/\s{2,}/.test(line)) problems.push(`line ${n} contains a double space`);
    if (!/[.!?]$/.test(line)) problems.push(`line ${n} does not end with terminal punctuation`);
    if (sentenceMarks(line) !== 1) problems.push(`line ${n} must be one sentence, found ${sentenceMarks(line)} sentence marks`);
    if (!/[a-zA-Z]/.test(line)) problems.push(`line ${n} has no letters`);
    if (/https?:\/\/|www\./.test(line)) problems.push(`line ${n} must not contain a link`);
    if (line.split(/\s+/).length < 5) problems.push(`line ${n} is too short to say anything`);
  }
  if (lines.length === 2 && lines[0] === lines[1]) problems.push("the two lines must not repeat each other");
  if (lines.length === 2 && !/^(do not|don't|never)\b/i.test(lines[0])) {
    problems.push("line 1 must warn the past self (start with Do not, Don't, or Never)");
  }
  // A warning with no concrete moment loses to any warning that names one:
  // line 1 must place the moment somewhere or sometime.
  const concrete = /\b(morning|night|taxi|building|outside|birthday|street|kitchen|office|phone)\b/i;
  if (lines.length === 2 && !concrete.test(lines[0])) {
    problems.push("line 1 must name a concrete time or place");
  }
  if (lines.length === 2 && !/\b(cost|lost|changed|meant|took)\b/i.test(lines[1])) {
    problems.push("line 2 must name what the moment cost or changed");
  }
  return problems;
}

const lines = loadLines();
const problems = collectProblems(lines);
if (problems.length > 0) {
  for (const problem of problems) console.error(`FAIL: ${problem}`);
  process.exit(1);
}

const entry = lines.join("\n");
console.log(entry);
console.log(`OK: ${entry.length}/${GATE_MAX_CHARS} characters, two lines, one sentence each.`);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/entry.txt`, `${entry}\n`, "utf8");
