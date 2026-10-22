# Inside an MCP server

Two servers both advertise themselves as "files." The first can read a single folder called `Atlas-Notes` in a sandbox. The second can read your entire home directory, including browser profiles, saved credentials, and every document you have ever downloaded. Both are technically file servers. The difference is not in the label. It is in the scope, the code, and the credentials.

MCP gives us a common shape for capability. It does not make all capabilities equivalent. A server is a real piece of software with real access, maintained by someone, running somewhere. To use one well, you need to understand what it can do internally and what it can see externally.

## A server is an adapter with keys

An MCP server translates between the standardized messages of MCP and the specific behavior of a system. It might:

- wrap a REST API;
- read files from a directory;
- query a database;
- control a browser;
- expose a search index;
- call internal company services;
- combine several of these behind a few tools.

The server holds the credentials or uses the authorization delegated by the user or client. That makes it a **trust boundary**. The model asks for something; the host passes the request; the server decides how to fulfill it using its own permissions. If the server has broad credentials, a narrow tool description will not save you.

A server can be small and single-purpose, such as the word counter in the hands-on chapter. It can also be a substantial service with a database connection, caching, rate limits, and an audit log. The protocol is the same; the trust analysis is not.

## Tools in detail

Tools are the most consequential primitive because they can act. A tool definition typically contains:

- a unique `name`;
- a human-readable `title`;
- a `description` written for both the model and people;
- an `inputSchema` expressed in JSON Schema;
- optional `outputSchema` or structured result conventions;
- optional annotations about safety and behavior.

### Descriptions are part of the interface

The model chooses tools based on their names and descriptions. A server that says "Interact with documents" for all five file operations is not giving the model enough information. A server that says:

> `read_text_file` — Read a UTF-8 text file from the approved workspace and return its contents. Use for reading, not writing. Paths are relative to the workspace root. Binary files are rejected. Files above 1 MB are truncated with a notice.

gives the model enough to make a reasonable choice and gives a reviewer enough to know the boundary. The description should state what the tool does, when to use it, and any non-obvious constraints.

### The input schema is not a security boundary by itself

A schema can declare types, required fields, string lengths, and enumerations. This prevents many malformed requests and helps the model construct valid calls. It cannot enforce business authority. For example, a schema can require a `client_id` but cannot know whether this user is allowed to read that client's records. The server must check authorization against the real identity and permissions.

The host should also validate what it receives. Defense in depth is not paranoia here; every layer that touches untrusted content should be skeptical.

### Results can be rich

MCP tool results can include text, images, audio, links to resources, and embedded resources. Recent revisions also support structured content that corresponds to an optional output schema. This is useful: a spreadsheet summary can return both a readable paragraph and a table of numbers; a document tool can return metadata plus a resource reference.

For safety and usability, results should be:

- **Scoped**: return only what the task needs, not the whole database.
- **Attributed**: make clear which source the data came from.
- **Bounded**: page large results and report truncation.
- **Structured where appropriate**: use fields for facts like IDs, amounts, dates, and statuses.
- **Free of secrets**: no session tokens, connection strings, or unrelated personal data.
- **Treatable as untrusted**: the host should not interpret returned instructions as commands.

### Annotations are hints

MCP includes optional tool annotations such as:

| Annotation | Meaning | What it does not mean |
|---|---|---|
| `readOnlyHint` | The tool is expected not to modify state | That the server is trustworthy or the data is safe |
| `destructiveHint` | The tool may make destructive changes | That the host will confirm each use |
| `idempotentHint` | Repeating the call should have the same effect | That retries are free or harmless |
| `openWorldHint` | The tool interacts with external, open-ended systems | That every destination is allowed |

These hints help a host choose sensible defaults or display warnings. They are supplied by the server. A malicious or buggy server can mislabel a destructive tool as read-only. A well-designed host should combine annotations with its own allowlists, confirmation rules, and the identity of the server. In other words: **annotations help, but they are not enforcement.**

## Resources in detail

Resources expose readable data. Each has a URI, a name, an optional description, and a MIME type. A server might offer:

```text
notes://atlas/brief
notes://atlas/meeting-2026-10-14
customers://acme/summary
file:///Users/maya/Sandbox/Atlas/brief.md
```

Resources can be static or templated. A **resource template** describes a family of resources, such as `customers://{customer_id}/summary`. The host can list templates and construct URIs with user input. This is convenient, and it requires validation: a template that accepts any string must not become a path traversal or an SQL injection.

Resources are often a better fit than tools for data that a human should explicitly attach. Instead of giving the model a `read_any_file` tool, a host can let the user pick a resource from a list. The model can request a specific known resource only if the host exposes that capability. This keeps the human in control of context selection.

Some servers support subscriptions or change notifications for resources. That means a client can be told when a document changes. For a beginner setup, you can ignore this. For a team building a live assistant, it is useful but adds complexity: stale caches, notification storms, and data updates during a task are real failure modes.

### Access is still a server decision

The URI scheme does not grant access. A `file://` URI is just an address. The server must resolve it inside an allowed boundary, check permissions, avoid following symlinks into forbidden locations, and handle sensitive files. If a filesystem server is given your entire home directory, a path that looks harmless can still reach a configuration file containing a token.

A resource server should enforce a **root**: a directory the server is allowed to read. The client's roots feature can communicate a desired boundary, but the server and operating system must enforce it. A root in a prompt is not a substitute for filesystem permissions.

## Prompts in detail

Prompts are user-selected templates. A prompt definition has a name, a description, optional arguments, and a function that builds messages. For example:

> `weekly_client_update` — Produce a client update from approved project notes. Arguments: `client_name`, `week_ending`, `tone` (brief or detailed).

When a user selects the prompt, the server returns a structured set of messages that the host can add to the conversation. This is a way to package expertise: the prompt can require sources, include a format, and remind the model about constraints.

Prompts are not actions. They do not automatically call tools. They are a way to start or shape a conversation. A prompt can be malicious if it comes from an untrusted server, just as a tool description can. It can ask the model to reveal context, ignore safety rules, or take steps that benefit the server. The host and user should see where a prompt came from and treat it as a suggestion with provenance.

## Client features from the server's side

Servers can use client-supported features to interact more flexibly:

- **Sampling** asks the client to produce a model completion. A server might use it to summarize a document using the host's model rather than requiring its own API key. The host should show the request and enforce policy. An untrusted server using sampling could try to get the model to process or disclose data unexpectedly.
- **Elicitation** asks the user for information. It can be a clean way to collect a missing parameter, but it can also be used for social engineering. The host must make the source and purpose clear and never collect secrets casually.
- **Roots** tells the server which filesystem locations the client considers relevant. Again, this is communication, not a sandbox.

Not every host supports every feature. A server that requires sampling will not work with a host that does not provide it. This is a common integration failure and not a sign that the server is broken.

## Local servers and remote servers

The transport determines a great deal about the risk.

| Question | Local stdio server | Remote HTTP server |
|---|---|---|
| Where does it run? | On your computer, as a child process | On someone else's infrastructure |
| What credentials can it use? | Local files, local environment, OS permissions, local sessions | OAuth tokens, API keys, service accounts, tenant identity |
| What leaves your device? | Depends on the server; it can make network calls | Requests and data cross the network |
| Main installation risk | Running untrusted code with your privileges | Trusting a third party with your data and availability |
| Main configuration risk | Overbroad filesystem or environment access | Overbroad OAuth scopes or tenant permissions |
| How to revoke | Stop and remove the server; clean up local state | Revoke the token and remove the connection |
| Can it be sandboxed? | Yes, with containers, users, and OS controls | Handled by the provider, but your data is still remote |

A local server can be very safe when it is a small, open-source program scoped to a folder and run without access to secrets. It can also be catastrophic when it runs arbitrary shell commands with your entire home directory. "Local" does not mean "trusted." A remote server can be a professionally operated service, or it can be an unknown endpoint collecting everything you send. "Remote" does not automatically mean "unsafe."

## Authorization for remote servers

Remote MCP servers need to know who is calling and what they may do. Recent MCP specifications use the OAuth family of standards for HTTP-based servers. The practical version:

1. You connect to a server in your AI app.
2. The app sends you to the service's authorization page.
3. You log in and see a list of permissions, called scopes.
4. You approve. The app receives a token for the server.
5. The app includes that token when calling the server.
6. You can revoke access later from the service or the app.

The details include registration, resource metadata, audience restrictions, and short-lived tokens. You do not need to memorize the RFCs, but you should understand the shape: **access is delegated, scoped, time-limited, and revocable**. If a connector asks for your password directly, or instructs you to paste an API key into a chat, treat that as a warning sign. Good OAuth flows do not require you to give your password to the AI app.

Token handling matters. A client should not pass one service's token through to a different service just because a server asked. A server should validate tokens for its own audience and not accept a token minted for someone else. If you are evaluating an integration, ask whether it uses a dedicated, least-privilege identity. "It works with our admin account" is a red flag, not a convenience.

For local servers, authentication may be your operating-system account and a configuration file containing an API key. That is simpler and riskier. Store secrets in environment variables or a secret manager, not in a repository. Restrict file permissions. Rotate keys. Use a dedicated account when possible.

## The server supply chain

Every server you install is software you are bringing into your trusted environment. Some questions to ask:

- **Who maintains it?** An official vendor, a well-known open-source project, or an anonymous package published last week?
- **Can you inspect it?** For local code, can you see the source and dependencies? For hosted services, is there a security and privacy page that is more than marketing?
- **What does it require?** Root access, broad filesystem access, administrative scopes, or network egress to arbitrary hosts?
- **How is it installed?** A pinned package version and lockfile, or a download-and-run command that may pull new code each time?
- **What is the update process?** Can you review changes? Are there releases and changelogs?
- **What data does it retain?** Logs, prompts, tool arguments, cached documents, credentials.
- **Can you get your data out and revoke access?** Is there an exit path?
- **What is the support model?** A community project may be excellent but should not quietly run a production process with no owner.

You do not need to perform a full security audit for a personal note-taking experiment. You do need to match the review to the authority. A server that can read a public folder and count words is not the same as one that can issue refunds and access every customer record.

## Designing a small server well

Suppose Maya wants a server for her studio's project notes. A careless design exposes:

- `read_file(path)` — reads any path on the machine.
- `write_file(path, contents)` — writes any path.
- `search(query)` — searches the entire home directory.
- `send_message(channel, text)` — posts to any chat workspace.

A safer design is narrower:

- `list_atlas_notes()` — lists Markdown notes inside `~/Studio/Atlas/Notes`.
- `search_atlas_notes(query, tags)` — searches only those notes, excluding files with `private` in the name.
- `read_atlas_note(note_id)` — reads one note by an opaque ID, with a size limit.
- `create_atlas_note_draft(title, body)` — writes to a drafts subfolder, never overwrites.
- `get_note_metadata(note_id)` — returns dates and tags without the full text.

Notice the pattern:

1. Scope is in the tool names and enforced in the code.
2. Reads and writes are separate.
3. There is no arbitrary path parameter in the common tools.
4. Write operations create drafts instead of overwriting.
5. Private files are excluded by a rule, not by a model's good manners.
6. The tools return identifiers and metadata, not the contents of the world.

This is more work than wrapping a filesystem library. It is the difference between an assistant and an unsecured remote control.

## Observability: can you see what happened?

A server should log enough to answer:

- Which client and user made the request?
- Which tool was called?
- What were the arguments, with secrets redacted?
- What resource was read?
- What was the outcome, including errors?
- How long did it take?
- Was the result truncated or filtered?

Logs are also a liability. They can capture customer data, personal information, prompts, and credentials. Decide what to retain, for how long, who can access it, and how to delete it. Do not log raw authorization headers or full documents by default. If your logs are shipped to a third-party service, that service is now part of your data boundary.

For a beginner, "observability" may simply mean using a host that shows tool calls and results, and keeping the server's own console output available when debugging. For a team, it means structured audit logs and a review process. Either way, the principle is the same: **if you cannot see what the agent did, you cannot manage it.**

## Recap

- An MCP server is real software with real credentials and a real trust boundary.
- Tools are model-facing actions; resources are readable data; prompts are user-invoked templates.
- Descriptions and schemas improve usability but do not enforce authority.
- Tool annotations are useful hints, not security guarantees.
- Local servers run with your privileges; remote servers require delegated authorization and careful data stewardship.
- Remote MCP can use OAuth-style delegated access with scopes and revocable tokens.
- Treat every server as a supply-chain decision. Scope permissions before installing anything.
- Good servers narrow their tools, enforce roots and allowlists, return bounded results, and log responsibly.

## Try this

1. Pick an MCP server you might use. List every capability it exposes and mark each as read-only, reversible, consequential, or financial.
2. Sketch a safer version with half as many tools. Which capabilities can be split or removed?
3. Trace where your data goes: from the document, through the server, to the model provider, and into logs. Which step is least clear to you?
4. Write an approval checklist for installing a community server. Include at least one question about maintenance and one about data retention.

The next chapter looks at connectors: the product packaging that turns an MCP server into a button a normal person can click, and the governance questions that packaging can hide.
