# Agent Health Monitoring System

**Version:** 1.0  
**Created:** 2025-11-14  
**Status:** Specification

## Overview

The Agent Health Monitoring System tracks agent performance, success rates, and system health. It provides real-time visibility into agent effectiveness and helps identify issues early.

## Metrics Tracked

### Per-Agent Metrics

1. **Success Rate**
   - Total tasks attempted
   - Tasks completed successfully
   - Tasks failed
   - Tasks blocked
   - Success percentage (target: ≥90%)

2. **Performance**
   - Average task duration
   - Duration by task size (S/M/L)
   - Tasks completed per day/week
   - Velocity trends

3. **Quality**
   - Test pass rate (target: 100%)
   - Code review pass rate
   - Regression rate
   - Confidence scores (average)

4. **Resource Usage**
   - Files modified per task
   - Lines changed per task
   - Number of commits
   - PR sizes

### System-Wide Metrics

1. **Coordination**
   - Inter-agent handoffs
   - Successful handoffs vs failed
   - Average handoff time
   - Blocking dependencies

2. **Error Patterns**
   - Common failure types
   - Resolution times
   - Escalation rates
   - Retry success rates

3. **Development Velocity**
   - Features completed per sprint
   - Bug fix cycle time
   - Documentation lag time
   - Release frequency

## Health Dashboard

### Dashboard Structure

```markdown
# Agent Health Dashboard
**Updated:** {timestamp}

## System Overview
- Overall Health: 🟢 Healthy / 🟡 Warning / 🔴 Critical
- Active Agents: {count}
- Tasks in Progress: {count}
- Success Rate: {percentage}

## Agent Status

| Agent | Status | Success Rate | Avg Duration | Last Active |
|-------|--------|-------------|--------------|-------------|
| Constructor | 🟢 | 92% | 45m | 2h ago |
| Insect-Enthusiast | 🟢 | 95% | 38m | 1h ago |
| Librarian | 🟡 | 85% | 22m | 6h ago |

## Recent Activity
- Constructor: Completed N1-tagging (success)
- Insect-Enthusiast: Fixed test failure (success)
- Librarian: Synced docs (warning: 1 conflict)

## Alerts
- ⚠️ Librarian: Success rate below target (85% < 90%)
- ℹ️ Bulldozer: Not used in 30 days
```

### Health Indicators

- 🟢 **Healthy**: Success rate ≥90%, no blockers, active
- 🟡 **Warning**: Success rate 75-90%, minor issues, slow response
- 🔴 **Critical**: Success rate <75%, blocked, or inactive >7 days

## Implementation

### Data Collection

1. **Agent Results**: Parse `reports/agent-results/*.yaml`
2. **Git History**: Analyze commits and PRs
3. **Test Results**: Track test pass rates
4. **Message Bus**: Monitor agent communication

### Health Check Script

```bash
#!/bin/bash
# .github/agents/infrastructure/health-check.sh

# Collect agent results from last 30 days
results=$(find reports/agent-results -name "*.yaml" -mtime -30)

# Calculate metrics per agent
for agent in constructor insect-enthusiast librarian ...; do
  success=$(grep "status: success" $results | grep "$agent" | wc -l)
  total=$(grep "agent: $agent" $results | wc -l)
  rate=$((success * 100 / total))
  echo "$agent: $rate% success rate"
done

# Generate dashboard
./generate-dashboard.sh > reports/agent-health-dashboard.md
```

### Automated Monitoring

- Run health check daily via GitHub Actions
- Post dashboard to PR comments
- Alert on degraded health
- Track trends over time

## Alerts and Notifications

### Alert Conditions

1. **Critical**
   - Agent success rate <75%
   - Agent inactive >7 days
   - System-wide failure rate >20%
   - Critical error in logs

2. **Warning**
   - Agent success rate 75-90%
   - Agent slow (>2x avg duration)
   - Handoff failures >10%
   - Test pass rate <100%

3. **Info**
   - New agent deployed
   - Configuration change
   - Milestone reached

### Notification Channels

- GitHub Issues (for critical alerts)
- PR Comments (for warnings)
- Dashboard updates (for info)

## Reporting

### Daily Report

```markdown
# Agent Health Report - {date}

## Summary
- Total tasks: 15
- Successful: 14 (93%)
- Failed: 1 (7%)
- Blocked: 0

## Top Performers
1. Insect-Enthusiast: 100% (5/5)
2. Constructor: 90% (9/10)

## Needs Attention
- Librarian: 1 failure (merge conflict)

## Trends
- Success rate: ↑ 5% vs last week
- Avg duration: ↓ 10m vs last week
```

### Weekly Report

- Aggregate daily metrics
- Identify patterns and trends
- Recommend improvements
- Celebrate successes

## Future Enhancements

1. **Predictive Analytics**
   - Forecast task duration
   - Predict failure probability
   - Suggest optimal agent for task

2. **Real-time Monitoring**
   - Live dashboard with websockets
   - Instant alerts
   - Real-time metrics

3. **Machine Learning**
   - Anomaly detection
   - Pattern recognition
   - Optimization suggestions

4. **Integration**
   - Slack/Discord notifications
   - Email alerts
   - Mobile app

---

**Status:** Specification complete - Ready for implementation  
**Next Steps:**
1. Create health-check script
2. Set up GitHub Actions workflow
3. Generate initial dashboard
4. Configure alerting
