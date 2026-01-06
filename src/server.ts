import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListTools } from "./tools/lists.js";
import { registerReminderTools } from "./tools/reminders.js";
import { registerBatchTools } from "./tools/batch.js";

export function createRemindersServer(): McpServer {
  const server = new McpServer({
    name: "reminders-mcp",
    version: "1.0.0",
  });

  // Register all tools
  registerListTools(server);
  registerReminderTools(server);
  registerBatchTools(server);

  return server;
}
