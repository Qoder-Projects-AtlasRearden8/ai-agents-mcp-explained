# Checklists, worksheets, and further reading

The chapters explain the ideas. This chapter is for the moment before you click Connect, hand over a folder, or approve an action. Print it, copy it into a notes app, or adapt it to your organization. A checklist is not a substitute for judgment, but it prevents the same obvious mistakes from being rediscovered every time.

## The five-question card

If you remember nothing else, ask these before granting an agent access:

1. **What is the job?** Narrow and observable, or vague and unbounded?
2. **What can it see?** Which data, with what scope, classification, and retention?
3. **What can it do?** Which tools can change the world, and which are read-only?
4. **When does a human decide?** Before sending, paying, deleting, publishing, or changing a record?
5. **How would we know, and how would we undo it?** What evidence remains, who reviews it, and what is the recovery path?

If a vendor cannot answer these, you cannot evaluate the product. If your own project cannot answer these, it is not ready for production.

## Pre-flight checklist

Use this before connecting an agent to a new data source or giving it a new tool.

- [ ] The job is written in one sentence, with explicit out-of-scope uses.
- [ ] A named person owns the workflow, including review and decommissioning.
- [ ] The data is classified: public, internal, confidential, or restricted.
- [ ] The agent reads the minimum data needed, from the narrowest practical scope.
- [ ] The account is dedicated or least-privilege, not a personal admin account.
- [ ] The tool catalog contains only what the workflow needs.
- [ ] Read and write capabilities are separated.
- [ ] Consequential actions require a specific human approval.
- [ ] The worst realistic failure is understood, and the response is planned.
- [ ] There is a way to stop the agent, revoke access, and restore data.
- [ ] Logs and traces are available, and someone knows how to read them.
- [ ] Test data or a limited environment is available for the first run.
- [ ] The pilot has a success measure, a stop rule, and an end date.
- [ ] Secrets are outside the prompt, the repository, and the logs.

If any of the last seven items is missing, start at a lower autonomy level or wait.

## Tool installation review

For a local MCP server or any software that will access your data:

- [ ] The publisher and source are identifiable.
- [ ] The code or hosted service has a maintained presence, documentation, and a way to report issues.
- [ ] The version is pinned where practical, and updates can be reviewed.
- [ ] The install command does not silently pull arbitrary latest code without review.
- [ ] The server requests only the permissions it needs.
- [ ] Local access is scoped to a dedicated folder or workspace.
- [ ] The server does not need your personal admin credentials.
- [ ] Logs and data retention are understood.
- [ ] A removal path exists, including local caches and tokens.
- [ ] A test with benign data has been run.
- [ ] A boundary test has been run: an out-of-scope path, recipient, or query is rejected.

For a hosted connector, add:

- [ ] The operator, hosting location, and subprocessors are clear.
- [ ] The scopes on the consent screen match the job.
- [ ] Admin consent requirements are understood.
- [ ] The provider's connected-apps page can revoke access.
- [ ] Contractual and privacy terms fit the data classification.

## Approval screen review

A confirmation dialog is only a safety control if a person can understand it quickly and accurately. Check that the screen shows:

- [ ] The exact action, not a vague "continue."
- [ ] The receiving person, account, domain, or destination.
- [ ] The amount, date, time, timezone, file path, or query when relevant.
- [ ] A preview, diff, or artifact that can be inspected.
- [ ] Which identity or account will perform the action.
- [ ] Whether the action is reversible and how.
- [ ] A clear way to edit or cancel, not only allow or deny.
- [ ] No default that confirms on Enter when the action is irreversible.
- [ ] A timeout that fails safe.
- [ ] A second approver for money, legal commitments, or high-impact changes.

Then ask: **Would a tired person at 5:30 p.m. be able to catch the mistake from this screen?** If not, improve the screen before increasing autonomy.

## Workflow specification worksheet

```text
Name:
Owner:
Job (one sentence):
Out-of-scope:
Trigger:
Sources and access (read):
Tools and permissions (write):
Human approval points:
Stop conditions (steps / time / cost / errors):
Success measure:
Failure measures and escalation:
Rollback / recovery:
Data classification and retention:
Review date:
```

A useful stress test: ask two colleagues to read the spec and describe what the agent is allowed to do. If their descriptions differ, the spec is not clear enough.

## Shadow-run log

Use one row per run during a pilot. Keep it simple.

| Date | Task | Agent proposal | Time saved | Edit needed? | Error type | Source issue? | Boundary issue? | Human decision |
|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |

Review the log weekly. Look for patterns, not just averages:

- Which categories need the most correction?
- Are errors concentrated in ambiguous cases?
- Did any error come from missing data rather than model reasoning?
- Did the agent ever cross a boundary, even harmlessly?
- Is review time falling as drafts improve?
- Are people actually using it?

## 30-day pilot plan

### Week 0

- [ ] Baseline the current process.
- [ ] Write the workflow spec.
- [ ] Set up a dedicated account and test data.
- [ ] Configure read-only or draft-only tools.
- [ ] Agree on metrics and stop conditions.
- [ ] Schedule the decision meeting.

### Week 1: shadow

- [ ] Run suggestions without committing actions.
- [ ] Compare with human work.
- [ ] Record corrections and missing sources.
- [ ] Do not expand scope yet.

### Week 2: assisted drafts

- [ ] Let users review and use drafts.
- [ ] Measure acceptance and edit time.
- [ ] Fix the most common source or instruction problem.
- [ ] Review the tool trace for unexpected calls.

### Week 3: narrow writes

- [ ] Enable the safest write action only.
- [ ] Keep specific approval.
- [ ] Check side effects in the real system.
- [ ] Review logs daily.

### Week 4: decision

- [ ] Review metrics against the baseline.
- [ ] Review incidents and near misses.
- [ ] Decide: continue, narrow, or stop.
- [ ] If continuing, set the next expansion and review date.
- [ ] If stopping, revoke access and document why.

## Weekly or monthly access review

Do this for any account that connects agents to work data.

- [ ] List active connectors, local servers, and API tokens.
- [ ] Confirm each still has a current owner and purpose.
- [ ] Remove unused connectors and tools.
- [ ] Check that permissions have not quietly expanded.
- [ ] Review recent tool calls for unexpected destinations, volumes, or failures.
- [ ] Confirm departing team members' access is revoked.
- [ ] Check for personal accounts bridging work data.
- [ ] Rotate or revoke stale credentials.
- [ ] Review incident logs and open follow-ups.
- [ ] Update the workflow spec if anything changed.

For a personal setup, a five-minute monthly review is enough. For a business, match the cadence and rigor to the sensitivity of the data.

## Incident quick card

When an agent does something it should not have:

1. **Stop.** Pause the workflow, disable the connector, or kill the process.
2. **Contain.** Revoke tokens and sessions. Isolate the local server or machine if needed.
3. **Preserve.** Save logs and traces before deleting or resetting.
4. **Assess.** What data was read? What actions succeeded? What is unknown?
5. **Recover.** Reverse transactions, restore backups, correct records.
6. **Notify.** Follow your security, privacy, legal, and management process.
7. **Learn.** Change a boundary, test, or approval design, not just a prompt.
8. **Document.** Timeline, impact, owners, and prevention.

Do not "fix" an authorization error by pasting a stronger credential into the chat. That often converts a temporary failure into a lasting security problem.

## A one-page cheat sheet

### The loop

Goal → model proposes → harness checks → tool acts → observation returns → repeat → final answer or stop.

### The roles

- **Host:** the AI app you use; owns the context, UX, and policy.
- **Client:** the connection inside the host to one server.
- **Server:** the program exposing tools, resources, and prompts.
- **Tools:** actions, usually model-chosen.
- **Resources:** readable data, usually application- or user-selected.
- **Prompts:** reusable templates, usually user-invoked.

### The safety habits

- Least privilege, read-only first.
- Drafts and previews before commitments.
- Specific human approval for consequential actions.
- Treat tool output and documents as untrusted.
- Keep secrets out of context.
- Break the lethal trifecta.
- Log, limit, and make the action reversible.
- Start at a lower autonomy level than feels exciting.

### The selection test

High frequency, clear success, variable inputs, recoverable errors, observable output, named owner. If several are missing, pick a different first workflow.

## Further reading

These are durable starting points rather than a giant link list. Check the current documentation for versions and features.

- **Model Context Protocol documentation** — <https://modelcontextprotocol.io> — the official introduction, concepts, and guides. Start with the architecture and security sections.
- **MCP specification** — <https://modelcontextprotocol.io/specification> — the technical contract, including transports, tools, resources, prompts, and authorization.
- **Anthropic's MCP introduction** — <https://www.anthropic.com/news/model-context-protocol> — the original announcement and motivation.
- **OWASP Top 10 for LLM Applications** — <https://genai.owasp.org/llm-top-10/> — a practical catalogue of risks including prompt injection, excessive agency, and sensitive information disclosure.
- **NIST AI Risk Management Framework** — <https://www.nist.gov/itl/ai-risk-management-framework> — a governance framework for organizations deploying AI, not specific to agents but widely used.
- **NCSC Guidelines for secure AI system development** — <https://www.ncsc.gov.uk/collection/guidelines-secure-ai-system-development> — security guidance for people building or procuring AI systems.
- **MCP reference servers** — <https://github.com/modelcontextprotocol/servers> — examples and implementations. Read the security notes; reference code is educational, not automatically production-hardened.

For product-specific configuration, use the documentation for your AI host and connector. This book describes patterns that outlive menu names; your app's current docs describe where the buttons are.

## A final word

An AI agent is not a smaller employee or a smarter search box. It is a new kind of software with a language model at the center, tools at the edges, and a loop in between. That design makes it flexible enough to help with messy, language-heavy work. It also means the old safety questions return in a new form: who has access, what can be undone, where did the data go, and who is accountable when the answer is wrong?

You do not need to be afraid of these systems to use them well. You need to be specific. Write down the job. Narrow the access. Make the action visible. Put a human at the consequential moment. Verify the outcome in the real world. Keep a way out.

MCP makes the plumbing more portable. Connectors make it easier to plug in. Neither one makes the decision for you. That is still the work, and it is work worth doing carefully.

If you take one habit from this book, make it this: **do not confuse fluency with authority, and do not confuse a connection with consent.** The agent can be helpful when you decide what it is allowed to know, do, and become. Start small. Review the trace. Widen the boundary only when the evidence earns it.

Then the assistant is not a magic box with your keys. It is a tool you understand, with limits you chose, doing work you can check.
