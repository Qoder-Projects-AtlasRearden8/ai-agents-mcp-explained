# Glossary

Terms are defined as they are used in this book. Products use words inconsistently, and the MCP ecosystem is still evolving. When a word matters to a decision, ask the vendor what it means in their implementation.

## A

### Access token

A credential that lets a client call a service on a user's behalf. Access tokens are usually short-lived and limited by scopes. They should be kept out of prompts, logs, and repositories. See [OAuth](#oauth).

### Agent identity

The account, token, or service identity an agent acts as. A dedicated, least-privilege identity makes actions attributable and revocable. Using a personal admin account makes every mistake more dangerous. See [Chapter 7](07-safety-and-permissions.md).

### Agent harness

The software around the model that builds context, runs the [agent loop](#agent-loop), enforces permissions, handles retries, presents approvals, and records traces. The model chooses; the harness enforces.

### Agent loop

The repeated cycle of model decision, tool call, observation, and revised decision, ending in a final answer or a stopping condition. See [Chapter 2](02-the-agent-loop.md).

### Agentic

A loose adjective for software that uses model-driven decisions and actions rather than only fixed rules. "Agentic" is not a measure of quality, safety, or usefulness. Ask what the system actually decides and what it can do.

### AI agent

Software that uses a language model to pursue a goal over multiple steps, including tool calls, with some autonomy and guardrails. See [Chapter 1](01-what-is-an-agent.md).

### Allowlist

An explicit list of permitted values: recipients, domains, file paths, tools, hosts, or commands. Allowlists are stronger than blocklists because they fail closed when they encounter something new. Enforce them in code, not only in a prompt.

### Annotation

Metadata supplied by an MCP server describing a tool, such as whether it is expected to be read-only or destructive. Annotations are hints, not proof, and should not be the only security boundary.

### API

Application Programming Interface, a defined way for software to talk to other software. An MCP server often wraps one or more APIs.

### Approval fatigue

The tendency to click "allow" without reading when a system asks too often or presents vague prompts. Good approval design is selective, specific, and rare enough to remain meaningful.

### Approval gate

A checkpoint where a human must approve a specific action before it executes. A strong gate shows the exact consequence: recipient, amount, file, query, diff, or account.

### Audit log

A record of who did what, when, and with what outcome. For agents, useful logs cover tool calls, arguments, approvals, errors, and side effects. Logs can contain sensitive data and need their own protection.

### Autonomy

The degree to which an agent can act without human intervention. It is a spectrum, not a switch: suggest, draft, ask before acting, act within rules, operate unattended. See [the autonomy ladder](01-what-is-an-agent.md).

## B

### Bearer token

A token that grants access to whoever presents it. If it leaks, it can be used like a password. Store it securely, limit its scope, use short expiration, and rotate after exposure.

### Budget limit

A cap on model usage, tool calls, or money for a task or period. A budget limit keeps a confused or looping agent from becoming an expensive one.

## C

### Capability negotiation

The MCP initialization step where client and server exchange protocol versions and supported features. It helps each side know what it can rely on, such as whether tools, resources, or prompts are available.

### Client (MCP client)

The part of an MCP host that connects to a server and exchanges MCP messages. A host may run one client per server connection. The client is plumbing, not the model.

### Computer use

An agent capability that operates a graphical desktop or browser by viewing screens and clicking or typing. It is powerful where no API exists, and risky because it can use logged-in sessions and reach anything visible. Prefer a dedicated profile or environment.

### Confused deputy

A security problem where a trusted program with legitimate access is tricked into using that access for someone else's goal. An overpermissioned tool server acting on injected content is a common agent example.

### Connector

A product-level integration shown in an AI application, often bundling an MCP server, authorization, a curated tool set, and support. "Connector" is packaging, not a guarantee that MCP is used or that the integration is safe. See [Chapter 6](06-connectors.md).

### Context

The information the model can see at a given moment: instructions, conversation, tools, retrieved documents, and tool results. Context is constructed by the harness, not magically known by the model.

### Context window

The maximum amount of text a model can consider at once. When it fills, older or lower-priority material may be truncated or compressed, which can cause an agent to "forget" constraints. Large context is not the same as good context.

### Credential

A secret used to prove identity or authorization: password, API key, access token, private key, session cookie. Give an agent as few and as narrowly scoped credentials as possible, and keep them outside model context.

## D

### Destructive action

An action that deletes, overwrites, or irreversibly changes data or configurations. Destructive tools need strong safeguards: narrow scope, previews, approvals, backups, or all three.

### Dry run

A preview mode that shows what an action would do without performing it. Dry runs are especially useful for bulk edits, deletes, migrations, and publishing.

## E

### Egress

Outbound network access from a sandbox or server. Restricting egress can prevent exfiltration and limit what a compromised tool can reach. If an agent can reach any address, its communication boundary is wide open.

### Elicitation

An MCP client feature that lets a server ask the user for additional information. It can improve a workflow, but it can also be abused for social engineering. The host must show the source and purpose clearly.

### Endpoint

A network address and path where a service accepts requests, such as an HTTP API or a remote MCP server. An endpoint is not the same as a tool; a server may expose several tools through one endpoint.

### Evaluation

A repeatable set of test cases used to judge an agent or workflow: accuracy, completeness, safety behavior, cost, and latency. Evaluations are more useful than a collection of impressive anecdotes.

### Exfiltration

Unauthorized movement of data to a destination the user did not intend. For agents, the dangerous combination is access to private data, exposure to untrusted content, and an external communication channel. See [lethal trifecta](#lethal-trifecta).

## F

### Function calling

A model API feature where the model emits a structured request to call a developer-defined function. The host or application executes it. MCP is a separate protocol for exposing capabilities to an AI application; the two are often used together.

## G

### Grounding

Tying a model's answer to specific evidence, such as retrieved documents, tool results, or database records. Grounding reduces but does not eliminate hallucination. A citation should be verifiable, not decorative.

### Guardrail

A control that constrains what an agent can do or when it must stop: permissions, approval gates, input limits, budgets, sandboxes, and filters. Guardrails are strongest when enforced in software rather than only requested in a prompt.

## H

### Hallucination

A confident output that is not supported by facts or available evidence. In agents, the problem is compounded because a hallucinated plan or tool argument can produce a real-world action. Grounding, verification, and narrow scope help.

### Host

The AI application that contains the user experience and MCP clients. The host calls the model, selects conversation context, presents approvals, and decides which servers and tools are available. See [MCP architecture](04-mcp.md).

### Human-in-the-loop

A design where a person reviews, approves, or decides at meaningful points. It is not a failure of automation; it is a way to place accountability where consequences are high or uncertain.

## I

### Idempotency

The property that repeating the same operation has the same effect as performing it once. Search is naturally idempotent; creating an invoice or sending an email usually is not unless the tool implements a key or de-duplication.

### Indirect prompt injection

An attack where instructions reach the model through content it reads, rather than through the user's direct message. Documents, emails, web pages, tickets, calendar invites, images, and tool results are common carriers. See [Chapter 7](07-safety-and-permissions.md).

### Input schema

A structured description of a tool's accepted arguments, usually JSON Schema. It helps the model form valid calls and lets the host or server reject malformed input. It does not establish that the caller is authorized.

## J

### JSON-RPC

A lightweight remote procedure call protocol encoded in JSON. MCP uses JSON-RPC 2.0 for requests, responses, notifications, and errors.

### JSON Schema

A standard vocabulary for describing JSON data shapes and constraints. MCP tool input schemas commonly use it. Schema validation is a useful layer, not a complete security policy.

## K

### Kill switch

A way to stop an agent quickly and prevent further actions, such as disabling a connector, pausing a workflow, or terminating a sandbox. The kill switch should be discoverable before an incident, not during one.

## L

### Least privilege

The principle of granting the minimum access needed for a task, for the minimum time, on the smallest scope. For agents: read-only by default, narrow folders, dedicated accounts, limited tools, and expiring credentials.

### Lethal trifecta

The combination of (1) access to private data, (2) exposure to untrusted content, and (3) the ability to communicate externally. Together they create a path for prompt injection to leak data. Break at least one link: restrict data, reduce untrusted exposure, or remove unapproved external actions.

### Local server

An MCP server running on the user's machine, commonly over stdio. It may be safe when scoped and sandboxed, and dangerous when it has broad filesystem, shell, or credential access. "Local" is not a synonym for "trusted."

## M

### MCP

The Model Context Protocol, an open standard for connecting AI applications to external tools, data, and prompt templates. It uses a host-client-server architecture and JSON-RPC messages, with stdio and HTTP-based transports. It makes integrations more portable, but it does not make them intelligent or safe. See [Chapter 4](04-mcp.md).

### MCP server

A program that exposes MCP capabilities such as tools, resources, and prompts. It translates protocol requests into operations against files, APIs, databases, or other systems. A server is software with credentials, logs, bugs, and an owner.

### Memory

Persistent information an agent or host retains across sessions, such as preferences, project facts, or prior decisions. Memory can improve continuity and can preserve stale or poisoned beliefs. Keep it scoped, reviewable, and deletable, and never use it for secrets.

### Model

The language model that generates text and tool-call suggestions. It does not itself execute tools, hold credentials, or enforce permissions; the harness around it does.

## O

### OAuth

An open authorization framework that lets an application obtain limited access to a service without receiving the user's password. MCP's HTTP-based authorization uses OAuth-family standards. For users, the key ideas are consent, scopes, tokens, expiration, and revocation.

### Observation

The result of a tool call that returns to the model: text, structured data, an error, an image, or a resource reference. Observations are evidence, but they can be incomplete or hostile. The loop depends on them.

### OpenAPI

A standard way to describe HTTP APIs. Some AI platforms turn OpenAPI operations into tools, and MCP servers may wrap OpenAPI-backed services. A machine-readable API description improves consistency but does not inherently make the API safe for model use.

### Overpermission

Access beyond what a task needs. Common examples are admin accounts for convenience, whole-drive access for one folder, and send-and-delete tools enabled during a drafting workflow. Overpermission expands the impact of every model mistake and injection.

## P

### Permission

The authority to perform an action or access a resource. In agent systems, permissions should be enforced by identity, tool, server, and data boundaries, not merely described in prompts. Review them as part of the product, not a settings footnote.

### Pilot

A time-boxed, limited-scope trial with explicit success measures, safety bounds, and a decision at the end. A pilot is not an indefinite production deployment with the word "pilot" attached.

### Prompt

The instructions and context given to a model. A prompt can include system rules, user requests, examples, and retrieved content. Prompts shape behavior but do not enforce permissions.

### Prompt injection

Content that tries to make the model follow instructions other than the user's or system's intent. Direct injection comes from user input; indirect injection arrives through documents, tools, or web content. There is no complete general solution; design the consequences to be limited.

### Prompt template

A reusable prompt exposed by an MCP server and invoked by a user, often through a slash command or menu. It can encode expertise and standard workflow steps. It is not an action and it does not make the workflow safe on its own.

## R

### Rate limit

A cap on how often a client or user may call a service. Agents can hit limits through retries, loops, or broad retrieval. Rate limits protect the upstream system and can also reveal runaway behavior.

### Read-only tool

A tool intended not to modify state. Read-only reduces risk but does not remove it: reading private data, ingesting injections, and exposing logs can still cause harm. Verify the claim in code where it matters.

### Redaction

Removing or masking sensitive data in logs, traces, errors, or shared reproductions. Redaction should cover tokens, passwords, personal data, and confidential content, and should happen before storage whenever possible.

### Remote server

An MCP server reached over a network, typically with Streamable HTTP and delegated authorization. It moves data and trust outside the local machine. Evaluate the operator, scopes, retention, and availability like any third-party service.

### Resource

An MCP primitive for readable data identified by a URI, such as a document, record, or log. Resources are generally application-controlled, making them useful for user-selected context. The server must enforce access boundaries.

### Resource template

A parameterized pattern for a family of MCP resources, for example `customers://{id}/summary`. Templates need input validation to prevent path traversal, injection, and access to unintended records.

### Retrieval

Finding and supplying relevant information to a model, often through search or a database query. Retrieval improves grounding but can return stale, biased, or incomplete material. The quality of the sources matters more than the cleverness of the query.

### Retrieval-augmented generation (RAG)

A pattern that retrieves relevant content and gives it to the model to generate an answer. In agent systems, retrieval may be a tool call, a resource, or built into the host. RAG is not a cure for hallucination if the retrieved content is wrong or ignored.

### Retry

Repeating an operation after a failure. Retry reads and safe idempotent writes when appropriate. Do not blindly retry consequential actions, because the first attempt may have succeeded even if the response was lost.

### Root

In MCP, a filesystem location a client tells a server is relevant to a session. Roots are a boundary signal, not an airtight sandbox. Path enforcement must happen in the server and the operating system.

## S

### Sampling

An MCP feature where a server requests a model completion through the client. It lets a server use the host's model without its own API key, but it also creates a path for an untrusted server to request model work. Hosts should keep consent and limits.

### Sandbox

An isolated environment for agent actions, such as a container, virtual machine, or dedicated user account. A useful sandbox limits filesystem access, network egress, privileges, time, and resources, and can be destroyed safely.

### Scope

In OAuth, a named permission granted to an application, such as reading files or sending messages. In a broader sense, the boundary of an agent's data and actions. Both meanings point to the same habit: ask what is allowed.

### Secret

A credential or sensitive value that must not be exposed, such as an API key, password, token, or private key. Keep secrets out of prompts, repos, URLs, and logs; store them in a secret manager or environment with restricted access; rotate after exposure.

### Side effect

A change caused by an action, such as sending a message, creating a record, or deleting a file. Read-only tools should have none. For writes, know whether the side effect is reversible, repeatable, and visible in logs.

### State

Information a workflow or server retains between calls or sessions. State is useful for multi-step tasks and creates risks such as stale data, session hijacking, concurrency conflicts, and data retention obligations. Keep it intentional.

### Stdio

Standard input/output, a local transport for MCP servers in which the host launches the server and exchanges JSON-RPC over its input and output streams. Logs must go to stderr because stdout carries protocol messages.

### Streamable HTTP

The HTTP-based transport for remote MCP, capable of streaming responses. Earlier MCP versions used a separate HTTP plus server-sent events transport; the specification has moved to Streamable HTTP. Remote connections need authentication and network security.

### Structured content

Tool results expressed as fields with types rather than only prose, such as a status code, an ID, or an amount. Structured output reduces ambiguity for the model and enables verification. It still needs validation.

### Supply chain

The software and services that go into a tool, including dependencies, package registries, maintainers, updates, and hosting. Installing a local MCP server or using a hosted connector is a supply-chain decision. Pin versions, review sources, and keep an exit path.

## T

### Threat model

A structured description of what you are protecting, who or what could cause harm, and how. For agents, common threats include mistakes, prompt injection, overpermission, data leaks, malicious servers, and runaway loops.

### Tool

A capability an agent can request, defined by a name, description, input, output, and often a permission boundary. Tools are how a model acts beyond text. The tool catalog is the practical map of an agent's power. See [Chapter 3](03-tools.md).

### Tool annotation

Metadata about a tool's expected behavior, such as read-only or destructive hints. Because annotations come from the server, they should be treated as claims. Combine them with enforcement and trust decisions about the server.

### Tool call

The structured request from a model to invoke a tool, including a tool name and arguments. The harness validates and executes it; the model does not call external systems directly.

### Tool poisoning

An attack or failure in which a tool's description, schema, or results contain misleading or malicious content intended to influence the model. Hosts and users must treat server-provided metadata and tool results as untrusted input.

### Transport

The mechanism carrying MCP messages between client and server, commonly stdio for local servers and Streamable HTTP for remote servers. Transport problems look different from model problems and should be tested separately.

### Trust boundary

A point where data or control passes between parties with different levels of trust, such as between a model and a server, a local machine and a hosted service, or a company and a third-party connector. Good architecture makes these boundaries explicit.

## U

### Untrusted content

Any content whose instructions you did not create or approve: web pages, incoming emails, shared documents, ticket text, tool descriptions, and outputs. It can inform an agent but must not silently control sensitive actions.

### URI

A uniform resource identifier, used by MCP resources to name data. A URI is an address, not an authorization. The server must check whether the caller may access what the address refers to.

## V

### Validation

Checking that input or output conforms to expected structure and constraints. Schemas, path checks, allowlists, and output checks are validation layers. Validation improves reliability; it does not replace authentication or authorization.

## W

### Write tool

A tool that creates, changes, or deletes state. Split writes from reads, prefer drafts and previews, use idempotency where retries are possible, and require approval for consequential or irreversible changes.

### Workflow spec

A short written description of an agent workflow: owner, job, trigger, scope, sources, tools, approvals, limits, success measures, and rollback. It is a design and review artifact, not bureaucracy. See [Chapter 8](08-real-workflows.md).
