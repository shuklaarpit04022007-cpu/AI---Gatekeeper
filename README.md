# AgentShield Guard

create a website AgentGuard: Autonomous AI Agent

Runtime Security & Action Gateway

Difficulty: Intermediate Theme: Agentic AI & AI Security

The Real-World Context (In Simple Words): In 2026, autonomous AI agents are

everywhere, but they can be dangerous. Enterprise workflows need an automated

firewall to prevent rogue behavior.

The Core Problem: AI agents with tool-calling capabilities can accidentally delete

databases or leak credentials due to prompt injection or reasoning loops.

Why This Problem Matters: In 2026, agentic AI deployment has accelerated, but runtime

security guardrails remain immature. Enterprise and developer workflows require an

automated firewall layer to prevent rogue agent behavior without degrading workflow

speed.

Your Exact 4-Hour Mission (What to Build):

● 1. Build middleware to intercept tool-call JSON payloads.

2. Create a policy engine to classify actions as Green (approve), Amber (log), or

Red (destructive).

● 3. Develop a web UI for real-time monitoring and human-in-the-loop authorization

for Red actions.

Recommended Tech Stack & Free Resources: Python (FastAPI/Flask), Streamlit

or React, Pydantic, JSON Schema validation.

4-Hour MVP Deliverable: Interceptor middleware that parses simulated agent tool-call

JSON objects, blocks high-risk operations, and renders a live approval dashboard.

Expected 60–90 Second Live Demo: Show a benign read action passing instantly,

followed by a destructive "drop_database_table" call that triggers a UI alert and

waits for manual approval.

Organizer & Judging Notes:

● Team Size: 2–4 members.

● Estimated Feasibility: High (~2.5 hours build, 1.5 hours testing/polish).

● Judging Focus: Policy engine reliability, latency of JSON parsing, clear UI risk

explanation.

● What to Reject as Incomplete: Static frontend mockups that do not intercept or

parse live JSON payloads.

● Bonus Features: Regex-based prompt injection detection in arguments; webhook

notification (Slack/Discord).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://agent-gatekeeper-62.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7a11f726-9e79-4b85-a7c3-6d9379831fc2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
