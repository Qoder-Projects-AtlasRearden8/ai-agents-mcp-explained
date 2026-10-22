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
