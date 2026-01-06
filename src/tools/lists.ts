import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeAppleScript } from "../applescript/executor.js";
import { listScripts } from "../applescript/scripts/lists.js";
import { parseListsOutput } from "../applescript/parser.js";
import { formatError } from "../utils/errors.js";

export function registerListTools(server: McpServer) {
  // List all reminder lists
  server.tool(
    "list_reminder_lists",
    "Get all reminder lists from macOS Reminders app. Returns list names, IDs, and reminder counts.",
    {},
    async () => {
      try {
        const output = await executeAppleScript(listScripts.getAllLists);
        const lists = parseListsOutput(output);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ lists }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(formatError(error), null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Create a new list
  server.tool(
    "create_reminder_list",
    "Create a new reminder list in macOS Reminders app.",
    {
      name: z
        .string()
        .min(1, "List name is required")
        .max(255, "List name too long")
        .describe("Name for the new list"),
    },
    async ({ name }) => {
      try {
        const id = await executeAppleScript(listScripts.createList(name));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `List "${name}" created successfully`,
                  id: id.trim(),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(formatError(error), null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Delete a list
  server.tool(
    "delete_reminder_list",
    "Delete a reminder list and all its reminders. This action cannot be undone.",
    {
      name: z
        .string()
        .min(1, "List name is required")
        .describe("Name of the list to delete"),
    },
    async ({ name }) => {
      try {
        await executeAppleScript(listScripts.deleteList(name));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `List "${name}" deleted successfully`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(formatError(error), null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Rename a list
  server.tool(
    "rename_reminder_list",
    "Rename an existing reminder list.",
    {
      currentName: z
        .string()
        .min(1, "Current name is required")
        .describe("Current name of the list"),
      newName: z
        .string()
        .min(1, "New name is required")
        .max(255, "New name too long")
        .describe("New name for the list"),
    },
    async ({ currentName, newName }) => {
      try {
        await executeAppleScript(listScripts.renameList(currentName, newName));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `List renamed from "${currentName}" to "${newName}"`,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(formatError(error), null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );
}
