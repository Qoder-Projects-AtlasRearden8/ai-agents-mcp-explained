# Choosing what to automate (and what not to)

June watched a demo where an agent reconciled invoices, drafted emails, and updated a dashboard. She came back to work with a list of eleven things to automate. Three months later, only one was still running. The others had been impressive in the demo, expensive to maintain, or simply not worth the review time.

This is a common pattern, and it is not a failure of enthusiasm. It is a failure of selection. The question "Can an agent do this?" is almost always yes for some version of the task. The better question is "Is this task worth doing with an agent, under these constraints, with this owner, and how would we know?"

## The fit equation

A task is a good early candidate when several of these are true:

| Factor | Good sign | Warning sign |
|---|---|---|
| Frequency | Happens daily or weekly | Happens twice a year |
| Time cost | Takes hours, is repetitive, or blocks other work | A two-minute task that already works |
| Variability | Inputs vary, language is involved, edge cases are numerous | Inputs and rules are fixed and deterministic |
| Stakes | Errors are recoverable or reviewed | Errors are irreversible, legal, or safety-critical |
| Data access | Sources are available, scoped, and trustworthy | Data is scattered, missing, or highly sensitive |
| Observability | You can inspect sources, outputs, and actions | Success is a feeling; no trace, no measure |
| Feedback | You can compare to a baseline and learn | No one knows what good output looks like |
| Ownership | A person will maintain and review it | Everyone wants it; no one owns it |

You can score these informally. A simple high, medium, low across the first six factors is enough to start a conversation. The point is not a precise score. It is to stop treating "cool demo" as a selection criterion.

Three factors deserve extra weight:

1. **Stakes.** High stakes require a much stronger safety case, and sometimes the correct answer is not to automate.
2. **Observability.** If you cannot tell whether the work is correct, you cannot safely expand autonomy.
3. **Ownership.** An ownerless agent gradually becomes an ownerless security risk.

## Good early candidates

The best first projects have a short loop and an obvious review step:

- Summarizing a defined set of documents into a known format.
- Classifying incoming messages into a small set of categories.
- Drafting replies to routine questions with a knowledge base.
- Extracting fields from structured-enough documents.
- Comparing a new version against a previous version.
- Preparing a weekly report from stable metrics.
- Finding and explaining relevant code for a developer.
- Producing meeting briefs from a calendar and a project folder.

Notice how many of these end in a draft, a label, or a summary. The work is valuable, the error is visible, and the human does not need to spend as much time as before.

## Poor early candidates

Some tasks are bad not because AI is useless for them, but because the current risk or measurement story is poor:

- **Irreversible financial or legal actions.** Payments, contract acceptance, refunds over a threshold, regulatory filings.
- **High-stakes decisions about people.** Hiring, firing, credit, housing, medical triage, discipline. These need human judgment, due process, and often legal review.
- **Unbounded research with autonomous actions.** "Investigate this market and sign up for what you need" combines untrusted content, private data, and external actions.
- **Tasks with no reliable source of truth.** If the answer is not written down anywhere accessible, the agent will guess fluently.
- **Customer-facing communication with no review.** The cost of a bad message is often much higher than the time saved by auto-sending.
- **Processes that are already broken.** Automating a confused process makes it faster and more confusing. Fix the process design first.
- **One-off tasks.** Setup and review may exceed the benefit. Use a chat assistant instead of building an agent.

This is not a permanent ban list. It is a statement that these are not the first place to earn confidence.

## Agency vs. automation

A common mistake is to use an agent when a simple deterministic process is better.

Consider a weekly report whose structure never changes. The data comes from a fixed query, the calculations are fixed, and the text follows a template. You could build an agent that decides how to gather and present it, or you could run a script that queries, calculates, renders, and emails the report. The script is easier to test, cheaper, faster, and more predictable. If you want a narrative, use a model to write it from the computed tables, with citations to the data.

Use an agent when:

- the inputs are variable and natural-language-heavy;
- the sequence of steps cannot be fully known in advance;
- the system must inspect results and adapt;
- selecting among options requires some judgment;
- the work is mostly reading, comparing, drafting, and checking.

Use fixed automation when:

- rules are stable and known;
- calculations must be exact;
- the steps are identical each time;
- compliance requires deterministic behavior;
- volume is high and the unit cost of model calls matters.

The strongest systems are often hybrid. The outer pipeline is deterministic, and the model is used at specific points: classify this message, extract these fields, draft this paragraph, compare these two policies, summarize this diff. The model's flexibility is valuable because it is bounded.

The phrase "agentic workflow" describes this well. Fixed outer structure, model at the joints. It is usually more reliable than an open-ended agent and more adaptable than pure scripting.

## Choose the lowest autonomy rung that works

Autonomy is not a single setting for a whole workflow. You can vary it by action:

- Inbox classification: fully automated after testing, because a wrong label is reversible.
- Reply drafting: automated, with human review.
- Sending email externally: human action.
- Adding an internal label: automated within an allowlist.
- Creating a calendar event: draft or approval, depending on reversibility.
- Modifying a customer record: approval and audit.

A workflow can therefore be mostly automated and still have one strong checkpoint where it matters. Do not accept a product's binary "autonomous mode" framing. Ask which actions are autonomous and which are gated.

The lowest rung that works is not always level 2. If a read-only weekly summary is accurate 99% of the time and errors are detectable, a scheduled run at level 4 may be perfectly reasonable. The point is to justify the rung with evidence, not to romanticize review.

## Buy, configure, or build

There are three broad paths:

| Path | What it means | Best for | Trade-offs |
|---|---|---|---|
| Buy/use a product | A hosted agent or connector with standard tools | Common workflows, fast start, no engineering | Vendor dependence, limited control, data governance, changing features |
| Configure | Assemble connectors, prompts, and permissions in a host | Departmental workflows, mixed tools | Integration complexity, permission management, uneven observability |
| Build | Write a custom MCP server or agent harness | Unique systems, strict boundaries, proprietary workflow | Engineering cost, maintenance, security responsibility |

Start with the lowest-effort path that satisfies the task and the risk. A hosted connector that reads one folder may be better than a custom server you cannot maintain. A custom server may be the only way to enforce a precise permission model on an internal database. "Build" is not a maturity badge; it is a commitment to operate software.

When buying, ask:

- What exactly can the agent access?
- Can I limit it to a folder, project, or dataset?
- Can I require approval for writes?
- Where is data processed and retained?
- What happens when I cancel? Can I export?
- Is there an audit log?
- What is the support model and roadmap risk?
- How do I test it safely before rolling it out?

When building, add the cost of maintenance, upgrades, incident response, and security review. The first version is not the full cost.

## The real cost model

A useful estimate has more terms than "subscription price."

```text
Monthly value = (time saved per run × runs × adoption × value of time)
              + (quality improvement you can actually measure)
              - (human review time)
              - (model and tool usage)
              - (maintenance and support)
              - (amortized build cost)
              - (expected incident cost)
```

None of these are perfectly knowable in advance. Make your assumptions explicit and revise them after the pilot. The discipline of writing them down prevents magical thinking.

A small worked example, with invented numbers:

- A weekly report takes June 150 minutes. A draft workflow could reduce her work to 40 minutes of review and correction, saving 110 minutes per week.
- Setup takes 20 hours. Ongoing maintenance and review of the workflow takes 2 hours per month. Model and connector usage is unknown but small relative to June's time.
- At roughly 4.3 weeks per month, the time saved is about 7.9 hours per month. After 2 hours of maintenance, the net is 5.9 hours per month. Setup is recovered in a few months, assuming the draft quality holds.
- If adoption is 50% because June does not trust it for busy weeks, the savings halve. If rework is high, they may disappear.

The arithmetic is not the answer. It is a tool for identifying which assumption matters. Here, draft quality and adoption matter more than the subscription price. That might lead you to invest in better sources and an approval screen rather than a cheaper model.

Do not ignore **review labor**. A workflow that produces a 4,000-word document in ten seconds but takes an hour to verify has not saved an hour. It may simply move the work. The best automations reduce total effort, not just typing.

## What to measure

Choose a small set of metrics before launch:

| Dimension | Example metric | Why it matters |
|---|---|---|
| Quality | Percentage of outputs accepted with no substantive edit | Measures real usefulness |
| Accuracy | Factual error rate on a sampled review | Detects confident mistakes |
| Speed | Median time from trigger to reviewable draft | Captures workflow benefit |
| Human effort | Review and correction minutes per output | The hidden cost |
| Safety | Number of boundary violations or unapproved actions | A zero-tolerance category |
| Escalation | Appropriate escalation rate for sensitive cases | Measures judgment |
| Cost | Model, tool, and infrastructure cost per completed task | Prevents silent overspend |
| Adoption | Weekly active use by the intended people | Detects a demo that never became work |
| Reliability | Failure rate, timeouts, repeated loops | Operational health |

For qualitative work, sample and review. "Accuracy 94%" can hide the fact that the 6% includes the only cases that matter. Stratify by risk: a mislabeled newsletter is different from a mislabeled legal threat.

## A 30-day pilot

A small, time-boxed pilot keeps the learning cheap.

### Week 0: Define and baseline

- Write the one-page workflow spec from [Chapter 8](08-real-workflows.md).
- Measure the current process for a week: time, volume, error rate, and pain points.
- Choose test data and a limited group of users.
- Set permissions to read-only or drafts.
- Agree on stop conditions and a review date.

### Week 1: Shadow mode

The agent produces suggestions but commits nothing. Compare its work with what humans do. Record corrections. Do not expand scope because one demo looked good. Look for systematic misses in the source data.

### Week 2: Assisted drafts

Let users review and use the agent's drafts. Measure edit time and acceptance. Fix the highest-friction problem: often a missing piece of context, a confusing tool name, or a bad default.

### Week 3: Narrow writes

Enable the safest write, such as creating an internal task or a draft. Keep approval. Watch for duplicate actions and permission errors. Review the audit trail daily.

### Week 4: Decide

Continue, narrow, or stop. Base the decision on the metrics and the incident log, not on general enthusiasm. If continuing, write down the next expansion, the re-review date, and the owner.

A pilot that never ends is not a pilot; it is unowned production. A pilot that scales before the evidence is a hope.

## Governance without bureaucracy

You do not need a committee for every to-do list agent. You do need an owner and a few written facts. A lightweight register can include:

- workflow name and owner;
- purpose and out-of-scope uses;
- data sources and classification;
- connectors, tools, and scopes;
- approval rules;
- cost and step limits;
- review cadence;
- incident contact;
- decommissioning steps.

Review the register when access changes, a new connector is added, or a major model update lands. If a workflow has no owner, it should not have production access.

## When to stop

Stopping is a legitimate outcome. Stop or reduce autonomy when:

- a boundary violation occurs;
- errors are frequent or hard for reviewers to catch;
- human review time exceeds the task's original time;
- the data is too unreliable to support the output;
- adoption stays low after a fair pilot;
- the maintenance burden exceeds the value;
- a vendor changes terms, permissions, or features in a way that breaks the safety case;
- no one is willing to own it.

A stopped experiment is not wasted. It is evidence that this task was not worth doing this way. Record why so the team does not repeat it.

## Recap

- Select for frequency, time cost, variability, reversibility, observability, and ownership. High stakes deserve extra caution.
- Start with draft, summarize, classify, and extract workflows where errors are visible.
- Use the least agency that meets the need. Fixed automation may beat an agent.
- Hybrid designs, with a deterministic pipeline and model judgment at specific steps, are often best.
- Autonomy can vary by action within one workflow.
- Buy, configure, or build according to fit, not status.
- Include review time, maintenance, and incident risk in the cost model.
- Measure quality, accuracy, effort, safety, cost, and adoption.
- Run a time-boxed pilot and decide explicitly whether to continue.

## Try this

1. Score three candidate tasks on the fit table. Which one has the best combination of value, evidence, and low stakes?
2. Estimate the review time for one workflow. Does the automation still save time when review is included?
3. Write a stop rule for a workflow you are considering. What would make you shut it down?
4. Identify one place where a fixed script would be safer than an agent. What remains for the model to do?

Even a well-chosen workflow will misbehave. The next chapter is a practical field guide to diagnosing what went wrong.
