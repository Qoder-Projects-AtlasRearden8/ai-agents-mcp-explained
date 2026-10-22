# When agents go wrong

The agent answered a question about your calendar, but the event is not there. The tool worked during setup and now it is missing. A draft went to the wrong client. The same task succeeds on Monday and fails on Wednesday. The chat transcript says "done," and the spreadsheet says otherwise.

Debugging an agent can feel strange because the usual software instinct, "find the line of code that is wrong," does not map neatly onto a system that makes probabilistic choices. But most failures are still ordinary: a missing permission, an expired token, a path that does not exist, a tool description that invites the wrong choice, a context that grew until the important detail fell out.

The trick is to stop treating the agent as one mysterious thing and debug it as a stack of layers.

## The stack, from top to bottom

1. **Goal and conversation.** What did the user actually ask? What constraints were in the current context?
2. **Model.** Did it choose a reasonable next step? Does it have enough information? Is it hallucinating?
3. **Host policy.** Is the tool enabled? Is approval required? Is the action being blocked or rewritten?
4. **MCP client and transport.** Is the connection alive? Is the protocol version compatible? Are messages reaching the server?
5. **MCP server.** Is the tool registered, the schema correct, the code handling the request?
6. **Credentials and scopes.** Is the token valid? Does it authorize this resource?
7. **Upstream service.** Is the calendar, database, API, or file system returning current data?
8. **Reality.** Did the side effect actually happen? Did the record change? Did the message send?

A failure at any layer can look like "the agent is dumb." For example: the agent says it cannot find the file, the model appears unable to use the filesystem tool, and the actual cause is that the server is scoped to a folder whose name changed after a project was renamed. Fixing the prompt would have made the explanation more eloquent, not the file more findable.

## Start with the symptom

Use this map to decide where to look first.

| Symptom | Likely layers | First check |
|---|---|---|
| Server will not start or connect | Config, command, transport, server | Run the server directly and read stderr |
| Connected but no tools appear | Server capabilities, host enablement, compatibility | Check the tool list in the host and the server logs |
| Tool is visible but never called | Model choice, description, host policy | Inspect the trace; ask the model to use it explicitly |
| Wrong tool is called | Tool naming, descriptions, overlapping capabilities | Reduce and rename tools |
| Tool call fails | Schema, arguments, server code, upstream API | Read the exact error and the arguments |
| Authentication or permission error | Token, scope, account, admin consent, audience | Reauthorize and review scopes |
| Result is empty or incomplete | Query, pagination, permissions, cache, truncation | Run the same request in the source system |
| Answer is fluent but false | Sources, grounding, context, injection | Verify every factual claim against a source |
| Action happened twice | Retry, timeout, idempotency | Check the side effect and the call log |
| Action happened with wrong parameters | Argument construction, ambiguity, injection | Review the exact tool call and approval screen |
| Slow, looping, or expensive | Step limits, context size, tool latency, retries | Check the trace and set a budget |
| Inconsistent across runs | Non-determinism, changing data, versions, context | Pin versions and test with a fixed dataset |

## Server and connection problems

### The server does not start

Check, in order:

1. **The command exists.** Is `node` on the host's `PATH`? Is the path to the script absolute and correct? A host often launches with a different working directory than your terminal.
2. **The version is compatible.** Does the host need a particular MCP SDK or protocol version? Does the server require a newer Node.js?
3. **Dependencies are installed.** Run the documented install command in the server directory. A server that worked in the terminal may be using a global package the host cannot see.
4. **The config is valid JSON.** A trailing comma or an unsupported field can prevent the host from parsing the entry. Some hosts silently ignore malformed servers; others show an error.
5. **The transport matches.** A stdio server cannot be reached by a URL, and a remote HTTP server cannot be launched with a command. Use the configuration style the server provides.
6. **Permissions and paths work for the host's user.** The host may run outside your shell environment with a different home directory or sandbox.
7. **The server is not writing logs to stdout.** On stdio, stdout is the protocol channel. A stray log line can corrupt initialization. Use stderr for diagnostics.

Run the server directly and observe stderr. For the word-counter example, `node server.mjs` will wait silently because it expects JSON-RPC input; use the provided test client instead. For most servers, the official test client or an MCP inspector is a better isolated test than the full host.

### It connects but the tool list is empty

A successful process launch does not guarantee a successful capability exchange.

- Did initialization complete, or did the server fail immediately after connecting?
- Does the server advertise the `tools` capability? A resources-only server will not have tools.
- Is the tool enabled for the current conversation, workspace, or user? Many hosts disable new tools by default.
- Did the host filter tools by policy, allowlist, or plan?
- Is there a protocol version mismatch that causes the host to show a partial catalog?
- Did a tool with an invalid schema cause the host to drop the whole list? Check the host logs.

Try the server with a minimal official test client. If the tool appears there but not in the host, the problem is likely host configuration or compatibility, not the server.

### It worked yesterday

A surprising number of agent failures are normal operations: an expired OAuth token, a revoked app, a service outage, a renamed folder, an updated API, a new model version, a changed tool description, or a depleted credit balance. Check whether anything changed before assuming the model became less capable.

Look at version pins and update history. If the host automatically adopted a new model or connector release, a behavior change may be expected. Re-run a known test case to distinguish a regression from a one-off.

## The model does not use the tool

The tool is visible and healthy, but the model answers from memory or asks for information it could retrieve. Possible causes:

- **The description is vague or does not mention the use case.** Improve it with concrete examples and constraints.
- **Too many similar tools.** The model chooses a general or similarly named tool. Remove redundancy and give tools distinct names.
- **The user did not ask for it.** Models often answer directly when a question seems answerable. Make the instruction explicit: "Use the order lookup tool; do not rely on memory."
- **The host policy suppresses the tool.** Some hosts require a tool to be enabled per message, or hide tools that need approval.
- **The tool is expensive or marked dangerous, and the host is steering away.** Check settings and annotations.
- **The required data is missing.** The model may ignore a tool that cannot accept the parameter it needs.
- **The context has grown noisy.** Long conversations can bury the tool instructions. Start a fresh thread with a focused task.

Inspect the actual trace. "It did not use the tool" and "it tried but the host blocked the call" look similar in a chat transcript, but they have different fixes.

## The wrong tool or the wrong arguments

This is usually a design problem, not a model defect.

- **Overlapping names.** `search_files`, `find_files`, and `get_file` sound identical. Rename by intent and scope.
- **Missing constraints in the schema.** Use enums, formats, date ranges, and required fields. Validate on the server.
- **Ambiguous natural language.** "Next Tuesday" depends on a reference date and timezone. Provide the date explicitly or have the tool require an ISO date.
- **Context confusion.** The model may use an old value from a previous message. Start fresh, restate the important facts, or pass identifiers from a trusted system.
- **Example drift.** Few-shot examples or a prompt may bias the model toward a particular tool. Update the instructions and test again.
- **Prompt injection.** An untrusted document may be steering the choice. Review the content that entered the context and the tool arguments it influenced.

The fix is often to make the wrong action impossible or obviously invalid, rather than to write a longer warning. If a refund tool only accepts amounts up to a fixed cap and only known order IDs, the model cannot invent an unlimited refund at an unknown store, regardless of what a malicious ticket says.

## Authentication and permission failures

Auth errors are common and should never be solved by pasting a password or token into the chat.

Typical causes:

- the access token expired;
- the user revoked the connection;
- the token is for the wrong account;
- a required scope was not granted;
- an admin must approve the app for the organization;
- the server expects a different audience or resource identifier;
- the app is configured for a test environment but the server uses production;
- a local server is using an old key from an environment file;
- the system clock is wrong, invalidating time-based assertions;
- the provider changed its authorization requirements.

Steps:

1. Read the exact error and identify which service rejected it.
2. Check the account shown by the host, not the account you assume.
3. Re-run the OAuth flow or reconnect. Use the provider's connected-apps page to inspect scopes.
4. Ask an administrator if organizational consent is required.
5. Confirm the environment: sandbox, staging, or production.
6. Update the server's configuration from a secret manager or environment variable, not a hard-coded value.
7. If a key may have been exposed, rotate it. Reconnecting is not the same as revoking an old token.

## Empty, stale, or incomplete results

The model returned an answer, but the facts are from the wrong time or the wrong slice of data.

Check the source directly. Then inspect:

- **Query semantics.** Was "last month" the calendar month or the last 30 days? Which timezone?
- **Pagination.** Did the tool return the first 20 results and stop? Did the agent ask for more?
- **Truncation.** Was a large document cut off? Does the tool report truncation, or silently omit content?
- **Permissions.** Is some of the data hidden from the agent's account? A search result may be empty because of access, not absence.
- **Index freshness.** A search index may lag behind the source. A support knowledge base may not include the newest policy.
- **Caching.** Is the server or client serving an old result? Is there a cache-busting refresh path?
- **Data quality.** Are there duplicates, missing fields, or inconsistent identifiers upstream?
- **Context loss.** Did the agent forget a constraint after a long loop? Did compaction remove a critical message?
- **Tool limits.** Does the tool cap results at 50 while the task requires all 400? Is there a documented way to page through them?

An agent that honestly says "the data returned was incomplete" is more useful than one that fills gaps with plausible detail. Reward that behavior in your prompts and evaluation.

## The confidently wrong answer

Now the hard part. The agent is fluent, specific, and wrong. Common reasons:

- The model answered from prior knowledge instead of using a tool.
- The available source was outdated or incomplete.
- The agent misinterpreted a document or conflated two entities.
- The tool returned a bug or a partial page, and the model treated it as complete.
- The model made a calculation error or invented a summary.
- Untrusted content instructed it to give a particular answer.
- The question was ambiguous, and the agent silently picked one interpretation.

Practical responses:

1. **Ask for evidence.** Require source links, quotes, IDs, or tool results for factual claims.
2. **Verify outside the chat.** Open the source. Query the database. Check the actual calendar or order. The agent's output is a draft until reality agrees.
3. **Separate calculation from narration.** Compute numbers deterministically and give the model the results. Do not ask it to do arithmetic in prose if exactness matters.
4. **Reduce the task.** A narrower question with a smaller source set is easier to ground and review.
5. **Make uncertainty acceptable.** Explicitly allow "not found" and "I cannot determine this from the available sources." If every answer must be confident, the model will invent.
6. **Test for injection.** Reproduce with a benign adversarial document in a controlled environment. If content can change behavior, examine the permissions and the approval design.
7. **Retire or reduce autonomy.** If reviewers cannot reliably catch the errors, the workflow is not ready for that level of trust.

More prompt instructions may help at the margin. They are not a substitute for source verification when the outcome matters.

## Duplicate actions and "unknown" outcomes

A timeout does not always mean failure. The request may have succeeded, and the response was lost. If the agent retries, you get two calendar events, two invoices, or two messages.

Look for:

- whether the tool is idempotent;
- whether the server uses an idempotency key;
- whether the harness retries automatically;
- whether the agent manually retries after an ambiguous error;
- whether the operation succeeded despite the displayed error.

For consequential actions, the correct response to "unknown" is to **check the actual state before retrying**, or escalate to a human. Design tools to return a stable operation ID and a definite state. Use a recovery path: list recent operations for this task, compare them with the intended action, and cancel duplicates if possible.

This is also a UX problem. A host that shows a spinning indicator and then silently retries trains users to expect a simple outcome. A good system says: "The request timed out. We found one matching invoice created at 10:42. Do you want to proceed?" That is much better than a blind second invoice.

## Slow, expensive, or looping agents

Check the trace before changing the model. Common causes:

- **Too many tools** consume context and increase deliberation.
- **Huge tool results** fill the context and make each turn expensive.
- **Pagination loops** keep fetching the same page.
- **Repeated retries** hammer a failing service.
- **Broad goals** invite exploration that never converges.
- **Long approval waits** are counted in wall-clock time but are not necessarily a model problem.
- **Rate limits** cause backoff and retry delays.
- **Model or network latency** dominates and may be outside your control.

Fixes:

- reduce the tool catalog to what the task needs;
- ask for a bounded result and report truncation;
- set step, time, and spending limits;
- add loop detection and repeated-call warnings;
- cache stable, non-sensitive data when appropriate;
- split a broad task into a short plan with checkpoints;
- use a smaller model for simple classification, if the host supports it, and reserve a stronger model for harder reasoning;
- establish whether the delay is model, tool, or human.

Cost should be observed per task, not just per month. An average that looks acceptable can hide a handful of runaway runs.

## Inconsistent behavior

Agents are probabilistic. The same request can produce different plans, wording, and tool choices. Other sources of variation include:

- a new model version or provider update;
- changing data in the source system;
- different time of day or timezone;
- expired caches;
- a different context history;
- concurrency and race conditions;
- tool timeouts;
- a different user identity or permission set.

For workflows that need consistency, reduce the degrees of freedom:

- fix parameters and reference dates;
- use schemas and enums;
- pin model and server versions where supported;
- start with a clean context;
- use deterministic calculations;
- keep a small evaluation set of representative inputs and run it after changes;
- separate creative drafting from factual lookup.

Do not promise perfectly identical output for a generative task. Promise a reliable process, an acceptable range of outputs, and a review step.

## Version and compatibility issues

MCP and its clients are evolving. A server may support a newer feature than the host, or use a transport the host does not implement. The result can be a missing tool, an initialization failure, or a feature that silently does nothing.

What to capture in a bug report:

- host name and version;
- server name, version, and source;
- MCP SDK version;
- protocol version;
- transport (stdio or HTTP);
- operating system and Node or runtime version;
- exact configuration with secrets redacted;
- the smallest prompt that reproduces the problem;
- relevant logs and tool trace.

Test with the smallest possible server and a direct client. If the issue reproduces without the host, it is likely in the server or the protocol. If it only happens in the host, test another server and compare.

## A minimal reproduction recipe

When an interaction fails, reduce it:

1. **Remove other connectors.** A conflict may be coming from another tool with a similar name.
2. **Start a new conversation.** Old context can contaminate the test.
3. **Use a short, explicit goal.** "Call `count_words` with the text 'one two three'."
4. **Use test data.** Never reproduce with a real customer record if a fake one will do.
5. **Inspect the raw tool call and result**, not just the assistant's summary.
6. **Run the server with its own test client.** Separate server behavior from host behavior.
7. **Change one variable at a time.** A new token, a renamed tool, a narrower path.
8. **Record versions and times.** "It worked before" is not reproducible without a baseline.

If the failure disappears when you remove complexity, add the complexity back piece by piece. This is ordinary debugging, applied to an extraordinary amount of prose.

## Debugging without leaking data

Traces and logs are essential and can be hazardous. A tool trace may contain email addresses, documents, database rows, authorization headers, or the text of a prompt injection. Before sharing a trace:

- redact tokens, cookies, passwords, and connection strings;
- mask personal data where possible;
- remove customer content that is not necessary to reproduce the issue;
- check whether the host or server uploads logs automatically;
- prefer a synthetic reproduction;
- use a private channel for the remaining sensitive details.

Do not paste a whole production trace into a public forum to ask why a tool failed. A redacted, minimal reproduction is faster to answer and less dangerous.

## When to fix, escalate, or stop

**Fix locally** when the issue is configuration, a clear bug, a stale token, or a misunderstanding in one conversation.

**Escalate** when the issue involves a security boundary, an unauthorized action, a data leak, repeated failures in production, a vendor outage, or an error you cannot reproduce safely. Go to the incident process in [Chapter 7](07-safety-and-permissions.md): stop, contain, preserve evidence, assess, recover, notify.

**Stop or reduce autonomy** when reviewers cannot detect errors reliably, the workflow's value does not cover its review cost, or the system depends on an unmaintained component. A graceful retirement is better than a permanent exception.

## A short post-incident template

```text
What happened (one paragraph):
When and for how long:
Affected people, data, or systems:
What the agent actually did (tool calls, outputs, side effects):
What we expected instead:
How we detected it:
Immediate containment:
Recovery and remaining uncertainty:
Root cause(s), including system design:
What would have prevented or detected it:
Owner and due date for each prevention:
Decision: resume / reduce autonomy / stop
```

The most useful line is often "cause(s), including system design." "The model hallucinated" is a description of a symptom. "The workflow let a read-only email trigger a send tool without approval" is a design defect you can fix.

## Recap

- Debug the stack: goal, model, host, client, transport, server, credentials, upstream service, and actual reality.
- Start with the symptom and the trace, not with a longer prompt.
- Most "model" failures are configuration, permissions, source data, or tool design.
- Verify side effects in the actual system, not only in the chat.
- Treat "unknown" outcomes as unknown; check before retrying.
- Reduce the failing case to a minimal reproduction and test the server separately.
- Protect sensitive data when sharing logs.
- Escalate security incidents through the proper process; reduce autonomy when reliability cannot be established.

## Try this

1. Take a recent failure and write which layer was actually at fault. What clue would have pointed there sooner?
2. Design an error message for a tool that rejects an out-of-scope path. Include what to do differently.
3. Run a minimal reproduction of a tool call using the test client, then through the host. Where do the results diverge?
4. Pick one workflow and write its stop/escalate criteria. Who decides?

The last chapters are reference material: a glossary you can actually use, and checklists to keep nearby when you set up a new agent.
