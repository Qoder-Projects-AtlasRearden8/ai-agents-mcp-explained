import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const serverPath = fileURLToPath(new URL("./server.mjs", import.meta.url));
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [serverPath],
});
const client = new Client({ name: "word-counter-test", version: "1.0.0" });

try {
  await client.connect(transport);

  const tools = await client.listTools();
  assert.equal(tools.tools.length, 1, "expected exactly one tool");
  assert.equal(tools.tools[0].name, "count_words");
  assert.equal(tools.tools[0].annotations?.readOnlyHint, true);
  assert.ok(tools.tools[0].inputSchema, "tool should expose an input schema");

  const result = await client.callTool({
    name: "count_words",
    arguments: { text: "Agents are useful. But they need guardrails." },
  });

  assert.equal(result.isError, undefined);
  assert.equal(result.structuredContent.words, 7);
  assert.match(result.content[0].text, /7 words/);

  console.log("MCP example test passed: tool listed and count_words returned 7 words.");
} finally {
  await client.close();
}
