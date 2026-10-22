# Build your first safe setup

The safest first MCP server is a boring one. It has one tool, no credentials, no network access, no filesystem access, and no ability to change anything. You can read the entire thing in a few minutes. It exists so you can watch discovery, invocation, validation, and results with your own eyes before you connect something that matters.

This chapter has two tracks. In **Track A**, you connect the included word-counter server to an MCP-compatible AI host and use it. In **Track B**, you read the code and run the automated test client. You can do either first, but doing both makes the protocol concrete.

The server is deliberately not a productivity tool. Counting words is almost useless. That is the point: when learning a new kind of access, start where a mistake is cheap.

> **Before you start:** use a test workspace, not production data. Do not place any real token, password, or customer data in a configuration file. The instructions here contain no secrets and the example server requires none.

## What you need

- **Node.js 20 or newer** and npm. The example was tested with Node.js 20.19.2; the package declares Node 20 as its minimum.
- An MCP-compatible AI application if you want to try Track A. This might be a desktop assistant, an IDE, or another host that supports local stdio servers.
- A terminal for Track B.
- The repository files. The server lives in `examples/word-counter-server/`.

You do not need an API key. You do not need a cloud account. The server does not call a model; the host and model decide when to call the tool.

## Track A: Connect it to an AI host

Product interfaces change, so this book will not pretend that every app has a menu called "MCP Servers." Look in your host's documentation for **MCP**, **connectors**, **developer settings**, or **integrations**, specifically for adding a local server with a command. Then add an entry equivalent to this:

```json
{
  "mcpServers": {
    "word-counter": {
      "command": "node",
      "args": [
        "/absolute/path/to/ai-agents-mcp-explained/examples/word-counter-server/server.mjs"
      ]
    }
  }
}
```

Replace the path with the real absolute path on your machine. Use forward slashes on macOS and Linux. On Windows, use the full path and follow the host's escaping guidance for backslashes. If `node` is not on the host's `PATH`, use the absolute path to your Node executable as the `command`.

Some hosts use a JSON file; some have a graphical form; some use project-level configuration. The fields are usually the same: a command to run, arguments to pass, and optional environment variables. Keep the server name simple. Do not add an environment block for this example; it does not need one.

### Step 1: Confirm the server starts

From the repository root, run the test once:

```bash
npm install
npm run test:mcp
```

You should see:

```text
MCP example test passed: tool listed and count_words returned 7 words.
```

If that fails, fix it before connecting a host. A host error with a broken server underneath is much harder to interpret.

### Step 2: Add and reload

Save the configuration and restart or reload your host as its documentation requires. Open the host's MCP or connector status view. You should see a server named `word-counter` and one tool named `count_words`.

A host may show additional metadata: the description, the input schema, and annotations such as read-only. Read them. You are checking that the host discovered the same tool the server intended, not just that a green dot appeared.

### Step 3: Inspect before using

Ask the host to list its available tools, or open the tool inspector if it has one. Look for:

- the name `count_words`;
- a description explaining that it counts words and does not save or send text;
- an input field called `text`;
- a note that this is a read-only tool;
- no unexpected tools or resources.

The server exposes only one tool. If you see others, they are coming from somewhere else. Tool catalogs can be surprising when several connectors are enabled.

### Step 4: Make a safe request

In a new conversation, ask:

> Use the word-counter tool to count the words in this sentence: A small tool is easier to trust.

The host may ask permission to run the tool. Approve it after checking that the arguments are the text you supplied. The result should be a word count, a character count, and a count excluding spaces. The exact formatting depends on the host.

Observe the trace if the host provides one. You should see one tool call, not a chain of hidden actions. The server has nowhere else to go.

### Step 5: Test the boundary

Ask:

> Use word-counter to read my email inbox and summarize the last ten messages.

A well-designed model will explain that the tool cannot do that. But the important test is not only the model's prose. Inspect whether any tool call was made and what arguments it contained. The server has no email capability. If a tool call occurred, it should have been rejected by schema validation or by the model's choice not to fabricate arguments. There is no path from `count_words` to your inbox.

Try an empty or very long input. The schema has a minimum of one character and a maximum of 100,000 characters. The request should fail with an understandable error, not truncate silently or crash the host.

### Step 6: Remove it

When you are done, remove the server entry or disable it, then restart the host. Delete any local copies if you do not need them. There are no tokens to revoke for this example, but make cleanup a habit anyway. A connector you forget about is still a connector.

## Track B: Read the server

The complete server is short enough to review. The comments here are explanations for the book; the shipped file is intentionally lean.

```javascript
#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "word-counter",
  version: "1.0.0",
});

server.registerTool(
  "count_words",
  {
    title: "Count words",
    description:
      "Count words in a passage of text. This tool only reads the text you provide; it does not save or send it anywhere.",
    inputSchema: {
      text: z.string().min(1).max(100_000).describe("The text to count"),
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async ({ text }) => {
    const words = text.trim().split(/\s+/u).filter(Boolean);
    const result = {
      words: words.length,
      characters: text.length,
      charactersWithoutSpaces: text.replace(/\s/gu, "").length,
    };

    return {
      content: [
        {
          type: "text",
          text: `${result.words} words, ${result.characters} characters, ${result.charactersWithoutSpaces} without spaces.`,
        },
      ],
      structuredContent: result,
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

This was tested with `@modelcontextprotocol/sdk` 1.32.1 and `zod` 4. The SDK's registration API has evolved across versions; if you are using a different release, check its documentation. The concepts stay the same.

### The imports

`McpServer` is the high-level server object. `StdioServerTransport` connects it to standard input and output so a host can launch it as a child process. `zod` defines and validates the input shape.

### The server identity

The constructor gives the server a name and version. These are visible in discovery and logs. Use a real version so you can tell which build is running. Do not include secrets or internal hostnames in these fields.

### The tool definition

`registerTool` takes a name, metadata, and a handler. The name is what the model must emit to call the tool. Keep it stable; renaming a tool breaks saved workflows and approval policies.

The description is the model's instruction manual. This one states the action, the input, and the fact that data is not retained. That last claim is true because the code has no storage and no network calls. It is a property of the implementation, not a reassuring sentence. If you add logging or analytics later, update the description and the privacy story.

The input schema has a minimum length of one character and a maximum of 100,000. That limit reduces accidental giant payloads. It is not a substitute for a server-side guard if you add expensive processing later.

The annotations say read-only and closed-world. They are useful signals, but as [Chapter 5](05-inside-an-mcp-server.md) explained, they are only hints. The real evidence is the code: no file writes, no network, no state.

### The handler

The handler counts words with a simple whitespace split, returns a human-readable text result, and includes structured content for clients that want fields. It has no access to the user's files or accounts. Its only input is the `text` argument.

One subtlety: the tool does not "read" the user's text from anywhere else. The host sends the argument. If the model invents a passage, the count will be for the invented passage. Tools are precise about their inputs, not omniscient about intent.

### The transport

The last two lines connect the server to stdio and wait for messages. If you run `node server.mjs` directly in a terminal, it will appear to hang. That is expected: it is waiting for JSON-RPC input. Do not add `console.log` messages in a stdio server, because standard output is the protocol channel. A stray log can corrupt the stream and make the client fail in confusing ways. Use `console.error` for diagnostics if you need them, or better, no console output at all.

## The test client

The repository includes `test-client.mjs`, a small MCP client that launches the server, lists tools, calls `count_words`, and asserts the result. It checks that the tool exists, that it has the expected read-only annotation, and that the word count is correct.

Run it from the repository root:

```bash
npm run test:mcp
```

Or run it inside the example directory after installing dependencies:

```bash
cd examples/word-counter-server
npm install
npm test
```

The test follows the real protocol. It does not call the handler directly. That matters: testing the function alone would miss a broken transport, a registration mistake, or an invalid schema.

A useful exercise is to break the server on purpose in a scratch copy: change the tool name, remove the schema, or return malformed content. Run the test. See which failure it catches. Then restore it. This teaches you more than a green checkmark.

## Add a tool, carefully

If you want to extend the example, keep the first additions read-only and local. For instance, you could add a tool that estimates reading time:

```javascript
server.registerTool(
  "estimate_reading_time",
  {
    title: "Estimate reading time",
    description:
      "Estimate reading time for plain text at 200 words per minute. Read-only; does not save or send text.",
    inputSchema: {
      text: z.string().min(1).max(100_000),
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async ({ text }) => {
    const words = text.trim().split(/\s+/u).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return {
      content: [
        { type: "text", text: `About ${minutes} minute${minutes === 1 ? "" : "s"}.` },
      ],
      structuredContent: { words, minutes, wordsPerMinute: 200 },
    };
  },
);
```

Before adding anything, ask:

1. **Does it need data from outside the user's provided input?** If yes, you are creating a trust boundary. Define scope and credentials.
2. **Can it change something?** If yes, split it into a preview or draft and a commit.
3. **Could repeated calls have side effects?** If yes, make it idempotent or require approval.
4. **Does it accept arbitrary paths, URLs, queries, or recipients?** If yes, validate against an allowlist.
5. **What is the worst realistic input?** Test it.
6. **What does it log?** Remove secrets and unnecessary personal data.

A server grows a trust problem before it grows a feature problem. Add capabilities in the smallest increments that prove useful.

## A hard boundary: do not start with filesystem write access

It is tempting to build a file tool because it makes the assistant feel powerful. Start with a read-only sandbox instead if you must explore files. A write-capable server introduces overwrites, path traversal, symlinks, permissions, backups, and irreversible deletion. Those are solvable engineering problems, but they are not beginner exercises.

If you later add filesystem access:

- point the server at a dedicated test folder, never your home directory;
- use a separate OS user or container;
- disallow absolute paths and path traversal;
- prevent following symlinks outside the root;
- default to read-only;
- write drafts instead of overwriting;
- log every mutation;
- test with files you can afford to lose;
- keep backups.

A well-designed server can be safer than a generic one. But the initial learning value comes from seeing the protocol, not from handing an agent your Documents folder.

## Connecting a remote server instead

If your host offers a hosted connector, you may not need a command at all. The host will show a URL, an OAuth consent screen, or an API key field. The safety questions from [Chapter 6](06-connectors.md) still apply:

- Who operates the server, and where is it hosted?
- What scopes does it request, and can you reduce them?
- Does it read, write, or both?
- What does it retain, and for how long?
- Can you revoke access cleanly?

A hosted server is not automatically better or worse than a local one. It moves the trust boundary. A local server on a hardened, scoped environment can be quite safe; a hosted server from an unknown vendor can be quite risky. Read the specifics, not the category.

## Verifying the integration, not just the server

When you connect a server to a host, test four things separately:

1. **Discovery:** Does the host show the expected tools and nothing extra?
2. **Execution:** Does a benign request produce a correct result?
3. **Boundary:** Does an out-of-scope request fail at the appropriate layer?
4. **Cleanup:** Does disabling the server remove the tools and stop calls?

A failure at discovery is a configuration problem. A failure at execution may be a transport or schema problem. A boundary failure is a security problem and should stop the rollout. A cleanup failure means access persists where you thought it was gone.

Keep a short log of these checks. For personal use it can be three lines in a notes app. For a team it belongs with the integration's owner and review date.

## When it does not work

A few quick checks:

- **The server is not listed:** verify the command exists, the absolute path is correct, and the host was restarted.
- **The server starts and exits:** run it directly to see errors on stderr; check that dependencies are installed.
- **Dependencies are missing:** run `npm install` in the example, or from the repository root if using workspaces.
- **The host cannot find `node`:** use the absolute path to the Node binary in the config.
- **The tool call fails validation:** check the schema and the arguments in the host trace.
- **The host shows no tool call:** the model may not have chosen the tool. Ask explicitly, or check that the tool is enabled in the current conversation.
- **Output is garbled or the connection drops:** look for stray stdout logs in the server.

If the host reports a protocol version or initialization error, the client and server may be incompatible. Use the versions recommended by the host's documentation and check the official MCP specification.

## Recap

- Start with a read-only server that has no credentials, no network, and no filesystem access.
- The example exposes one tool and returns both human-readable and structured results.
- Connect it through a local command configuration, inspecting the discovered tool and its schema.
- Test discovery, execution, boundaries, and cleanup.
- Run the real protocol test client; direct handler tests are not enough.
- Never write logs to stdout in a stdio server.
- Do not begin with filesystem write access. Add capabilities in small, reviewable steps.
- A green connection indicator is not a security review.

## Try this

1. Connect the word-counter server to an MCP host and inspect the tool description the model receives.
2. Run `npm run test:mcp` and then change the expected word count to a wrong value. Observe the failure, then restore it.
3. Add the reading-time tool and write a test for a one-word input and a 1,000-word input.
4. Write a one-page configuration note for your future self: command, path, purpose, permissions, cleanup steps. You will thank yourself when something breaks.

The next two chapters are about judgment: which work is worth automating, and what to do when an agent fails.
