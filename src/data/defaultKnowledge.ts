import { EnterpriseDocument, DocumentChunk, LanguageOption } from '../types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', flag: '🇨🇳' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flag: '🇧🇷' },
];

export const DEFAULT_DOCUMENTS: EnterpriseDocument[] = [
  {
    id: 'doc-sop-dev-042',
    title: 'SOP-DEV-042: Project Phoenix Kubernetes & ArgoCD Deployment SOP',
    department: 'DevOps & Infra',
    category: 'SOP',
    description: 'Standard Operating Procedure for deploying Project Phoenix microservices across Staging (us-east-1) and Production (multi-region with ArgoCD & canary rollout).',
    fileType: 'md',
    author: 'Elena Rostova (Principal SRE)',
    lastUpdated: '2026-02-14',
    version: 'v3.4.1',
    chunksCount: 4,
    totalWords: 780,
    tags: ['deployment', 'phoenix', 'kubernetes', 'argocd', 'canary', 'rollback', 'ci-cd'],
    content: `# SOP-DEV-042: Project Phoenix Kubernetes & ArgoCD Deployment SOP
Version: 3.4.1 | Owner: Cloud Infrastructure & SRE Team | Target: Production & Staging

## 1. Overview & Architecture
Project Phoenix is deployed across Google Cloud GKE clusters in three regions (\`us-central1\`, \`europe-west1\`, \`asia-east1\`) using GitOps managed by ArgoCD. All releases must pass through the automated GitHub Actions CI pipeline, deploy to the Staging environment for 15 minutes of automated synthetic testing, before receiving a production rollout approval.

## 2. Pre-deployment Checklist
Before triggering a production deployment:
1. Ensure all PR checks in \`repo/phoenix-core\` are passing (unit tests, integration test suite, SonarQube quality gate > 85%).
2. Verify that database migrations are backward-compatible. If a breaking column migration is required, execute the Expand/Contract schema pattern.
3. Check the \`#deployments-phoenix\` Slack channel for any active freeze or incident locks.
4. Confirm staging health metrics: Grafana Dashboard > Phoenix Latency p99 < 85ms and Error Rate < 0.01%.

## 3. Step-by-Step Deployment Procedure

### Step 1: Trigger Staging Build & Deploy
Run the following GitHub CLI command or trigger workflow via GitHub Actions UI:
\`\`\`bash
gh workflow run deploy-staging.yml -f target_branch=main -f release_tag=v2026.2.14
\`\`\`
Verify staging status via ArgoCD CLI:
\`\`\`bash
argocd app get phoenix-staging --grpc-web --server argocd.internal.corp
\`\`\`

### Step 2: Run Synthetic Smoke Tests
Execute the end-to-end regression suite against Staging API endpoints:
\`\`\`bash
npm run test:smoke -- --env=staging --tenant=qa-primary
\`\`\`

### Step 3: Promote to Production (Canary Rollout)
Once Staging passes, initiate the 10% canary traffic rollout to Production:
\`\`\`bash
argocd app set phoenix-prod -p spec.canaryWeight=10
argocd app sync phoenix-prod
\`\`\`
Observe Prometheus metrics in Datadog / Grafana for 10 minutes. If 5xx error rate remains under 0.05%, proceed to promote full traffic:
\`\`\`bash
argocd app set phoenix-prod -p spec.canaryWeight=100
argocd app sync phoenix-prod --force
\`\`\`

### Step 4: Verification & Slack Announcement
Post deployment completion in \`#deployments-phoenix\`:
\`\`\`bash
/deploy-bot announce status=success app=phoenix version=v2026.2.14
\`\`\`

## 4. Rollback & Disaster Recovery
If p99 latency spikes above 250ms or HTTP 500 error rate exceeds 0.5% during canary:
1. **Immediate Automated Rollback**:
\`\`\`bash
argocd app rollback phoenix-prod
\`\`\`
2. **Hard Override to Previous Image**:
\`\`\`bash
kubectl rollout undo deployment/phoenix-core-deployment -n production
\`\`\`
3. Notify the On-Call Incident Commander in \`#war-room-incident\` immediately.`
  },
  {
    id: 'doc-sop-dev-018',
    title: 'SOP-DEV-018: Production Incident Escalation & On-Call Runbook',
    department: 'DevOps & Infra',
    category: 'Runbook',
    description: 'Protocol for managing P1 (Critical Outage) and P2 (Major Degradation) incidents, PagerDuty paging, war room assembly, and executive communications.',
    fileType: 'md',
    author: 'Marcus Vance (VP Engineering)',
    lastUpdated: '2026-01-20',
    version: 'v4.0.0',
    chunksCount: 3,
    totalWords: 620,
    tags: ['incident', 'p1', 'p2', 'pagerduty', 'oncall', 'sla', 'escalation', 'runbook'],
    content: `# SOP-DEV-018: Production Incident Escalation & On-Call Runbook
Version: 4.0.0 | Applies to all Engineering & Cloud Operations Teams

## 1. Incident Severity Definitions
- **P1 - Critical Outage (SLA: 5 min ack, 15 min triage)**: Customer-facing service completely unavailable, data corruption risk, or payments flow blocked.
- **P2 - Major Degradation (SLA: 15 min ack, 30 min triage)**: Significant core feature failure affecting >10% of users with no immediate workaround.
- **P3 - Minor Issue (SLA: 2 hours)**: Non-critical bugs, cosmetic issues, or single-tenant intermittent errors.

## 2. On-Call Escalation Workflow
1. **Acknowledge Alert**: The Primary On-Call engineer must acknowledge PagerDuty within 5 minutes. If unacknowledged within 5 minutes, Secondary is paged automatically; after 10 minutes, the Engineering Manager is paged.
2. **Open Incident Channel**: Run the Slack incident slash command:
\`\`\`bash
/incident create title="P1: Payments Gateway Timeout Spike" severity=P1
\`\`\`
This creates a dedicated channel \`#inc-2026-[ID]\`, generates a Google Meet war room bridge, and adds Incident Commander (IC), Communications Lead, and SRE Lead.

## 3. Communication Cadence & Statuspage
- **Internal Updates**: Post a summary in \`#incident-broadcast\` every 15 minutes for P1s and every 30 minutes for P2s.
- **Customer Statuspage**: Update \`status.internal.corp\` within 10 minutes of incident declaration using pre-approved templates:
  *"We are investigating elevated error rates affecting API endpoints. Our engineering team is actively diagnosing."*

## 4. Post-Incident Review (PIR) Protocol
A blameless postmortem meeting must be scheduled within 48 hours of resolution. The Incident Commander must complete the Notion PIR template with Root Cause Analysis (5 Whys), timeline, and Jira action items tagged with \`p0-fix\`.`
  },
  {
    id: 'doc-pol-hr-2026',
    title: 'POL-HR-2026: Global Employee Handbook, Paid Leave & Remote Stipends 2026',
    department: 'HR & People',
    category: 'Policy',
    description: 'Complete 2026 policy regarding Unlimited Flexible PTO, 16-week Parental Leave, $1,500 Home Office stipend, Health benefits, and Working Abroad rules.',
    fileType: 'pdf',
    author: 'Sarah Jenkins (Chief People Officer)',
    lastUpdated: '2026-01-05',
    version: 'v2026.1',
    chunksCount: 4,
    totalWords: 890,
    tags: ['hr', 'pto', 'vacation', 'leave', 'parental', 'stipend', 'wfh', 'benefits', 'insurance'],
    content: `# POL-HR-2026: Global Employee Handbook, Paid Leave & Remote Stipends 2026
Effective Date: January 1, 2026 | Applies to: All Full-Time Global Employees

## 1. Flexible Paid Time Off (PTO) & Sick Leave
- **Unlimited Flexible PTO**: We operate on a trust-based flexible time-off model. We recommend a minimum of 20 days off per calendar year to prevent burnout.
- **Approval Guidelines**: Requests of 3 consecutive business days or fewer require only calendar blocking and team notification. Requests of 4+ consecutive business days must be submitted via BambooHR at least 2 weeks in advance for manager approval.
- **Company Holidays**: In addition to flexible PTO, employees receive 12 regional public holidays plus 2 Global Wellness Recharge Days (first Friday of May and October).
- **Sick & Mental Health Days**: No prior notice required. Simply inform your manager on Slack and set your status to "Out Sick".

## 2. Parental Leave Policy
- **Primary & Secondary Caregivers**: All full-time employees with at least 6 months of tenure are eligible for **16 weeks of 100% paid parental leave** following the birth, adoption, or foster placement of a child.
- **Flexible Timing**: Parental leave can be taken continuously or in two separate blocks within the first 12 months of the child's arrival.
- **Transition Back**: Employees returning from parental leave are entitled to work a 4-day (80% hours) week at 100% pay for their first 4 weeks back.

## 3. Remote Work & Annual Stipends
- **Home Office Setup Allowance**: New hires receive a one-time **$1,000 USD** equipment setup allowance on their first paycheck for ergonomic desks, chairs, monitors, or accessories.
- **Annual Wellness & Ergonomic Stipend**: All continuing employees receive **$1,500 USD per calendar year** (reimbursable via Brex / Expensify) for home office upgrades, internet reimbursement ($75/month), gym memberships, or mental health counseling.
- **Learning & Development (L&D)**: **$2,000 USD annually** for conferences, books, certification exams (AWS, GCP, CKA), and online courses (Coursera, O'Reilly).

## 4. International Remote Work Policy (Digital Nomad)
Employees may work from another country for up to **60 calendar days per rolling 12-month period**, provided there is at least a 4-hour timezone overlap with their core team and local legal compliance is met. Submit a "Work Abroad Request" in BambooHR 3 weeks prior.`
  },
  {
    id: 'doc-doc-eng-302',
    title: 'DOC-ENG-302: Core Payments & Subscriptions API v2 Spec',
    department: 'Engineering',
    category: 'API Spec',
    description: 'Technical specification for Payments API v2, detailing JWT authentication, Idempotency-Key headers, Stripe Connect webhooks, and rate limit rules.',
    fileType: 'md',
    author: 'David Chen (Staff Platform Architect)',
    lastUpdated: '2026-02-01',
    version: 'v2.2.0',
    chunksCount: 3,
    totalWords: 710,
    tags: ['api', 'payments', 'stripe', 'jwt', 'idempotency', 'endpoints', 'rate-limits'],
    content: `# DOC-ENG-302: Core Payments & Subscriptions API v2 Spec
Base URL: \`https://api.internal.corp/v2/payments\` | Auth: Bearer JWT

## 1. Authentication & Required Headers
All API requests must include the following HTTP headers:
- \`Authorization: Bearer <service_jwt_token>\` (Generated via Vault OAuth token exchange, TTL 1 hour).
- \`X-Tenant-ID: <uuid>\` (UUID of the organization account).
- \`Idempotency-Key: <uuid-v4>\` (**MANDATORY** on all POST/PUT payment mutations to prevent duplicate charges).
- \`Content-Type: application/json\`

## 2. Core Endpoints

### 2.1 Process One-Time Charge
- **Endpoint**: \`POST /v2/payments/charges\`
- **Request Body**:
\`\`\`json
{
  "customerId": "cus_9921448",
  "amountInCents": 4900,
  "currency": "USD",
  "paymentMethodId": "pm_card_visa",
  "metadata": {
    "orderId": "ord_2026_0982",
    "featureFlag": "phoenix_billing_v2"
  }
}
\`\`\`
- **Success Response (201 Created)**:
\`\`\`json
{
  "chargeId": "ch_77391823",
  "status": "succeeded",
  "amountInCents": 4900,
  "currency": "USD",
  "receiptUrl": "https://pay.internal.corp/receipts/ch_77391823"
}
\`\`\`

### 2.2 Create or Upgrade Subscription Plan
- **Endpoint**: \`POST /v2/payments/subscriptions\`
- **Params**: \`customerId\`, \`priceTierId\` (\`enterprise_annual_2026\`, \`growth_monthly\`), \`seatsCount\` (integer).

## 3. Rate Limits & Exponential Backoff
- Rate limit per tenant: **500 requests per second (RPS)** burst, **200 RPS** sustained.
- If HTTP \`429 Too Many Requests\` is returned, clients must inspect the \`Retry-After\` header and use exponential backoff with full jitter:
  \`wait_time = min(cap, base * 2 ** attempt) + random_jitter\`

## 4. Webhook Handling & Signature Verification
Webhooks from Stripe Connect are delivered to \`https://api.internal.corp/v2/webhooks/stripe\`.
Verify signature using header \`Stripe-Signature\` and secret \`whsec_live_payments_2026\` stored in HashiCorp Vault path \`secret/data/payments/stripe\`.`
  },
  {
    id: 'doc-sop-sec-099',
    title: 'SOP-SEC-099: AWS IAM & Cloudflare Zero-Trust Access Request Guide',
    department: 'IT & Security',
    category: 'SOP',
    description: 'How to request temporary and permanent AWS IAM roles, production database read-only access via Teleport, and Cloudflare Warp Zero-Trust VPN.',
    fileType: 'doc',
    author: 'Priya Sharma (Head of InfoSec)',
    lastUpdated: '2026-01-28',
    version: 'v2.1',
    chunksCount: 2,
    totalWords: 490,
    tags: ['security', 'iam', 'aws', 'teleport', 'database', 'access', 'vpn', 'cloudflare', 'okta'],
    content: `# SOP-SEC-099: AWS IAM & Cloudflare Zero-Trust Access Request Guide
Version: 2.1 | InfoSec & Access Management Team

## 1. Access Request Principles (Least Privilege)
Direct SSH access and long-lived static AWS IAM access keys (\`AKIA...\`) are strictly prohibited in production. All access is granted via Okta Single Sign-On (SSO) and temporary role assumption (STS).

## 2. Requesting AWS Production Console & CLI Roles
1. Open the internal Access Portal at \`https://access.internal.corp\`.
2. Select target AWS Account: \`prod-workloads-01\` or \`staging-workloads-02\`.
3. Choose role:
   - \`DeveloperReadOnly\` (Instant automated approval for Engineering).
   - \`SRE-BreakGlass-Admin\` (Requires 2 manager approvals + active PagerDuty incident ID).
4. Maximum session duration is **4 hours**. Session auto-terminates after inactivity.

## 3. Production Database Access via Teleport
To query production Postgres or ClickHouse clusters for debugging:
1. Log in via CLI:
\`\`\`bash
tsh login --proxy=teleport.internal.corp:443 --auth=okta
tsh db login --db-user=analyst_ro prod-postgres-cluster
\`\`\`
2. All SQL queries are masked for PII (emails, card numbers, passwords) and logged to CloudWatch audit trails.

## 4. Cloudflare Warp Zero-Trust VPN
Install Cloudflare WARP client from Self-Service portal. Connect using company email. 2FA re-authentication is required once every 7 days.`
  },
  {
    id: 'doc-pol-hr-104',
    title: 'POL-HR-104: Engineering Career Ladder & Bi-Annual Promotion Guidelines',
    department: 'HR & People',
    category: 'Policy',
    description: 'Overview of engineering IC levels (IC1 Junior to IC7 Principal), expectations across Execution, Architecture, Culture, and the Q2/Q4 promotion review cycle.',
    fileType: 'pdf',
    author: 'Engineering Leadership Committee',
    lastUpdated: '2026-02-05',
    version: 'v2026.1',
    chunksCount: 3,
    totalWords: 580,
    tags: ['promotion', 'career', 'levels', 'ic3', 'ic4', 'ic5', 'compensation', 'review'],
    content: `# POL-HR-104: Engineering Career Ladder & Bi-Annual Promotion Guidelines

## 1. Engineering IC Levels
- **IC1 / IC2 (Associate / Software Engineer)**: High velocity on well-defined tasks, builds robust unit/integration tests, participates actively in code reviews.
- **IC3 (Senior Engineer)**: Owns complex end-to-end features, designs resilient architectures, mentors junior engineers, leads on-call rotations.
- **IC4 (Staff Engineer)**: Drives technical direction across multiple teams, resolves cross-system bottlenecks, writes high-impact RFCs, elevates engineering culture.
- **IC5 / IC6 (Principal / Distinguished Engineer)**: Multi-year company-wide technical strategy, sets company tech standards, industry thought leadership.

## 2. Bi-Annual Review Timetable
- **Q2 Cycle (Summer)**: Self-evaluations open May 1st; peer feedback due May 15th; calibration committees meet June 1-10; adjustments effective July 1st.
- **Q4 Cycle (Winter)**: Self-evaluations open November 1st; peer feedback due November 15th; calibrations meet December 1-10; adjustments effective January 1st.

## 3. Promotion Packet Requirements
To submit a promotion packet:
1. **Evidence of sustained performance at the next level for at least 6 consecutive months**.
2. **3 to 5 peer reviews**, including at least one cross-functional stakeholder (Product Manager, Design Lead, or QA).
3. **List of top 3 impact projects** with quantifiable metrics (e.g., "Reduced checkout API p99 latency from 450ms to 95ms", "Migrated billing engine saving $120k/yr in infrastructure costs").`
  },
  {
    id: 'doc-doc-eng-409',
    title: 'DOC-ENG-409: Postmortem Incident #409: Redis Cache Stampede & Resolution',
    department: 'Engineering',
    category: 'Meeting Notes',
    description: 'Detailed blameless postmortem analysis of the January 14 Redis cluster memory exhaustion, root cause, 5 whys, and preventative architectural fixes.',
    fileType: 'md',
    author: 'Alexandre Dubois (Staff Infrastructure Engineer)',
    lastUpdated: '2026-01-16',
    version: 'v1.0.0',
    chunksCount: 2,
    totalWords: 520,
    tags: ['postmortem', 'redis', 'cache', 'incident', 'outage', 'circuit-breaker', 'engineering'],
    content: `# DOC-ENG-409: Postmortem Incident #409: Redis Cache Stampede & Resolution
Date of Incident: January 14, 2026 | Severity: P1 | Total Downtime: 18 minutes

## 1. Executive Summary
On Jan 14 at 14:22 UTC, the user session Redis cluster reached 100% memory utilization, triggering an OOM kill loop on primary nodes. This caused authentication failures across all web & mobile clients for 18 minutes until traffic shedding and memory eviction policies were updated.

## 2. Root Cause Analysis (5 Whys)
1. **Why did Redis run out of memory?** Key count jumped from 2.1M to 18.5M in 40 minutes.
2. **Why did keys spike?** A newly merged feature in user notifications cached full JSON payloads with TTL=0 (no expiration).
3. **Why did it have no expiration?** The default config in \`notificationCache.ts\` passed \`null\` instead of \`DEFAULT_TTL_SECONDS = 86400\`.
4. **Why didn't tests catch it?** Unit tests mocked the Redis client and did not validate TTL arguments.
5. **Why didn't Redis evict old keys?** Redis eviction policy was set to \`noeviction\` instead of \`volatile-lru\`.

## 3. Action Items Completed
- Updated Redis cluster eviction policy to \`volatile-lru\` with memory ceiling at 80% maximum memory.
- Added strict linting and runtime schema validation enforcing positive TTL on all \`redis.set()\` calls.
- Integrated automated Redis load tests into the CI staging pipeline.`
  },
  {
    id: 'doc-jira-kb-882',
    title: 'JIRA-KB-882: Common Build Failures, Docker BuildKit & CI Troubleshooting',
    department: 'Engineering',
    category: 'Jira Archive',
    description: 'Knowledge base of recurring CI/CD build issues in GitHub Actions, Docker BuildKit cache invalidation, and Node.js 22 ESM module resolution fixes.',
    fileType: 'jira',
    author: 'CI/CD Tooling Team',
    lastUpdated: '2026-02-18',
    version: 'v1.8',
    chunksCount: 2,
    totalWords: 460,
    tags: ['jira', 'build', 'docker', 'ci', 'github-actions', 'npm', 'troubleshooting'],
    content: `# JIRA-KB-882: Common Build Failures, Docker BuildKit & CI Troubleshooting

## 1. Issue: "Docker BuildKit cache export failed (403 Forbidden)"
- **Symptom**: CI step \`docker/build-push-action\` fails with \`error exporting layer: 403 Forbidden on ghcr.io\`.
- **Fix**: The GitHub Actions runner token expired or lacks write permission to GitHub Container Registry. In your workflow YAML, ensure:
\`\`\`yaml
permissions:
  contents: read
  packages: write
\`\`\`
Clear the workflow cache via: \`gh cache delete --all -R repo/phoenix-core\`.

## 2. Issue: "Cannot find module or type declarations in Node 22 ESM"
- **Symptom**: \`ERR_MODULE_NOT_FOUND\` when running \`tsx\` or \`node\` on compiled dist files.
- **Fix**: In TypeScript 5.8+ and Node 22 ESM, verify that \`tsconfig.json\` has \`"moduleResolution": "bundler"\` and package.json includes \`"type": "module"\`. For relative imports in TypeScript, use extensionless imports when bundling with esbuild/vite.

## 3. Issue: "Database connection pool exhausted during integration tests"
- **Symptom**: \`PostgresError: remaining connection slots are reserved for non-replication superuser connections\`.
- **Fix**: In \`vitest.config.ts\`, pass \`maxConcurrency: 4\` and ensure \`afterEach(async () => { await db.destroy(); })\` closes the test connection pool.`
  },
  {
    id: 'doc-slack-archive-phoenix',
    title: 'SLACK-ARCHIVE: #proj-phoenix Engineering Discussions & Key Architecture Decisions',
    department: 'Engineering',
    category: 'Slack Highlights',
    description: 'Curated Slack conversations, ADR summaries, and architectural consensus regarding GraphQL deprecation, gRPC microservices, and secrets vault migration.',
    fileType: 'slack',
    author: 'Archival Bot / #proj-phoenix',
    lastUpdated: '2026-02-10',
    version: 'v2026-W06',
    chunksCount: 2,
    totalWords: 510,
    tags: ['slack', 'phoenix', 'architecture', 'grpc', 'graphql', 'vault', 'adr'],
    content: `# SLACK-ARCHIVE: #proj-phoenix Engineering Discussions & Key Architecture Decisions

## Thread: Decision to sunset GraphQL in favor of gRPC + REST OpenAPI v3
- **@tomas_sre (Lead Architect)**: "Summary of today's architecture review: For inter-service communication between Phoenix Core, Billing, and Analytics, we are standardizing on **gRPC (protobuf v3)** for low-latency serialization. External public APIs will continue to expose REST OpenAPI v3. The legacy Apollo GraphQL gateway will be fully deprecated by End of Q2 2026."
- **@priya_sec**: "Make sure all gRPC endpoints enforce mutual TLS (mTLS) via Istio service mesh."
- **Consensus**: Approved by Tech Steering Committee.

## Thread: Production Secrets Migration to HashiCorp Vault
- **@devops_kyle**: "Reminder: Kubernetes secrets in plaintext are deprecated. All apps must fetch secrets at startup using the Vault Agent Sidecar injector (\`vault.hashicorp.com/agent-inject: 'true'\`). See \`SOP-SEC-099\` for role binding instructions."`
  }
];

export const INITIAL_SUGGESTIONS = [
  'How do I deploy Project Phoenix to staging and production?',
  'What is our 2026 parental leave policy and returning schedule?',
  'What required headers and rate limits apply to Payments API v2?',
  'How do I request AWS IAM access and production database login?',
  'What caused Incident #409 and how was the Redis stampede resolved?',
  'What is the annual home office and WFH equipment stipend for 2026?'
];
