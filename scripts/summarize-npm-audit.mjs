import { appendFileSync, readFileSync } from 'node:fs';

const reportPath = process.argv[2] || 'npm-audit-report.json';
const report = JSON.parse(readFileSync(reportPath, 'utf8').replace(/^\uFEFF/, ''));
const vulnerabilities = report.metadata?.vulnerabilities || {};
const summary = Object.entries(vulnerabilities)
  .map(([severity, count]) => `${severity}: ${count}`)
  .join(', ') || 'none';

console.log('Vulnerabilities:', summary);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `### npm audit\n\nVulnerabilities: ${summary}\n`,
  );
}
