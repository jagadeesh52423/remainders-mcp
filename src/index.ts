#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createRemindersServer } from "./server.js";
import { checkRemindersPermission } from "./applescript/executor.js";

async function main() {
  // Check permissions on startup
  const hasPermission = await checkRemindersPermission();
  if (!hasPermission) {
    console.error(
      "Warning: Reminders permission may not be granted. Please grant permission in System Preferences > Privacy & Security > Automation when prompted."
    );
  }

  const server = createRemindersServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("Reminders MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
