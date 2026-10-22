# Preface: A new kind of software

Imagine asking a computer to "get me ready for tomorrow's client meeting." For decades, the honest reply was a calendar reminder and maybe a search box. Today, a new kind of software can look at your calendar, open the project folder, find the latest proposal, notice that the client asked a question in an email, draft an agenda, and leave the whole thing in your drafts folder for review.

That is an AI agent: not a smarter chat window, but software that can take steps toward a goal. It still is not a person, and it is not trustworthy by default. It can be brilliant for twenty minutes and then confidently email the wrong file to the wrong person. The difference between a useful agent and a small disaster is usually not the intelligence of the model. It is the design of the system around it: what it can see, what it can do, when it must ask, and how you can check its work.

This book explains that system in plain English.

## Why this book exists

Most explanations of AI agents fall into two camps. One is a marketing page with a lot of fog and the word "autonomous." The other is a technical document that assumes you already know what a JSON schema, an OAuth scope, and a transport are. Neither is much help when you are trying to decide whether to connect an agent to your email, or why the thing keeps failing to open the right spreadsheet.

The middle ground is where normal people live. Maybe you run a small business, manage a team, write for a living, handle operations, teach, or you are simply the person everyone asks when the computer misbehaves. You do not need to build a model from scratch. You do need a durable mental model of what these systems are, where the risk sits, and how to get useful work out of them without handing over your keys.

That is what this book aims to give you.

The book is built around three questions:

1. **What is actually happening** when an AI agent does something on your behalf?
2. **How do tools and MCP** let that agent reach beyond the chat window, and why is everyone talking about a protocol?
3. **How do you use this safely enough to be worth it?**

We will answer those questions with examples, diagrams, checklists, and a few stories about things going wrong. The goal is not to turn you into a machine-learning engineer. It is to help you read a product page, design a workflow, ask better questions, and recognize when someone is selling magic.

## The one-sentence version

An AI agent is a language model inside a loop, given a goal and a set of tools, with some rules about when it may act and when it must stop.

MCP, the Model Context Protocol, is a common plug for connecting those tools to AI applications. It is the difference between every device having its own charger and finally agreeing on a port. The protocol does not make an agent smart or safe. It makes integrations more portable. Safety comes from how the whole system is configured.

If you remember only one thing from this book, remember this: **an agent's permission list is part of its intelligence.** A capable agent with read-only access to a sandbox will seem less impressive in a demo than one with your email password. It will also be far less likely to ruin your Tuesday.

## Who this is for

This book is for curious beginners and careful practitioners. It assumes no coding experience, though later chapters include short code examples you can skip if you are using a no-code product. It is also for technical people who want a shared vocabulary for talking with colleagues who do not live inside an IDE.

You will get the most out of it if you read straight through once. The early chapters establish ideas that later chapters depend on. If you are here for a specific answer, the quick paths are:

- **"What is an agent?"** Start with [Chapter 1](01-what-is-an-agent.md), then [Chapter 2](02-the-agent-loop.md).
- **"What is MCP and why should I care?"** Start with [Chapter 4](04-mcp.md), then [Chapter 5](05-inside-an-mcp-server.md).
- **"I want to set one up safely."** Read [Chapter 7](07-safety-and-permissions.md), then [Chapter 9](09-build-your-first-setup.md).
- **"Just show me useful workflows."** Go to [Chapter 8](08-real-workflows.md).
- **"Something is broken."** Go to [Chapter 11](11-when-agents-go-wrong.md).
- **"What does that word mean?"** Use the [Glossary](12-glossary.md).

There are exercises at the end of most chapters. They are short on purpose. Reading about permissions is useful; drawing your own permission boundary on a napkin is what makes it stick.

## What this book will not do

It will not tell you that an agent is going to replace your job, or that it is useless. Both claims are too easy and neither helps you get work done. It will not recommend that you give an experimental system your bank password, and it will not pretend that a sternly worded prompt is a security control. It will not settle every product-specific question, because AI products change faster than printed books can keep up.

It also will not tell you that you must use MCP. MCP is an important piece of plumbing, especially if you want one connector to work across several AI applications. But a simple task may need only a fixed workflow, a search index, or a human with a checklist. The most sophisticated tool is not automatically the right one. Throughout the book we will ask the same question: what is the least complicated thing that safely does the job?

## A note on examples

The people in this book are fictional composites, not real clients or companies. Maya runs a small design studio with four employees. She uses a desktop AI assistant, a shared drive, email, and a calendar. June is the operations lead at a thirty-person company. She spends too much of every Friday assembling a report from a spreadsheet, a database, and a chat tool. Rowan is a developer who looks after a modest web application. Their names and details are invented, but the patterns are drawn from ordinary work: reading, drafting, checking, summarizing, moving information from one place to another, and asking a human before doing something irreversible.

Any configuration snippets are illustrative. Products rename menus and change their configuration formats. Always check the current documentation for the tool you use. Never copy a security setting from a book without understanding what it does. And never put a real password, API key, or private token into a file you might share.

## How to read a system

One habit will serve you throughout this book and beyond it. When someone presents an AI agent, do not begin with the model. Begin with these five questions:

1. **What is the goal?** Is it narrow and observable, or vague and unbounded?
2. **What can the agent see?** Which files, messages, records, and web pages enter its context?
3. **What can it do?** Which tools are available, and which of them change the world rather than merely reading it?
4. **When does a human decide?** Before reading, before drafting, before sending, or only after an incident?
5. **How would we know it did the job correctly?** What evidence remains, and who can reverse a bad outcome?

Those five questions are a better safety review than a page of confidence claims. They also make you a sharper buyer of software. A product that can answer them clearly is usually a product someone has thought about. A product that answers only the first one is a demo.

## A final word before we begin

AI agents can be genuinely useful. They can shorten the distance between knowing what needs to happen and having a first draft of it. They can read the boring attachment, reconcile the messy spreadsheet, find the three relevant files, and prepare the meeting so that you start with judgment instead of preparation.

They can also be wrong in fluent sentences. They can be tricked by a document they were asked to summarize. They can treat a malicious web page as an instruction. They can cost money, send messages, and touch things that were not part of the plan. The point of this book is not to talk you out of using them. It is to help you build a relationship with them where trust is earned, bounded, and revocable.

That is possible. It starts with understanding what the machine is actually doing. Turn the page.
