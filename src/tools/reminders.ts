import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeAppleScript } from "../applescript/executor.js";
import { listScripts } from "../applescript/scripts/lists.js";
import { reminderScripts } from "../applescript/scripts/reminders.js";
import {
  parseListsOutput,
  parseRemindersOutput,
  parseReminderOutput,
} from "../applescript/parser.js";
import { formatError } from "../utils/errors.js";
import { Reminder, PriorityMap, PriorityName } from "../types/reminder.js";

const prioritySchema = z.enum(["none", "low", "medium", "high"]);

export function registerReminderTools(server: McpServer) {
  // Get reminders with filtering
  server.tool(
    "get_reminders",
    "Get reminders with optional filtering by list, completion status, priority, date range, or search text.",
    {
      listName: z
        .string()
        .optional()
        .describe("Filter by list name. If omitted, searches all lists."),
      completed: z
        .boolean()
        .optional()
        .describe(
          "Filter by completion status. true=completed, false=incomplete, omit for all."
        ),
      priority: prioritySchema
        .optional()
        .describe("Filter by priority level"),
      dueBefore: z
        .string()
        .optional()
        .describe("Filter reminders due before this date (ISO 8601 format)"),
      dueAfter: z
        .string()
        .optional()
        .describe("Filter reminders due after this date (ISO 8601 format)"),
      searchText: z
        .string()
        .optional()
        .describe("Search in reminder name and body"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(500)
        .default(100)
        .describe("Maximum number of reminders to return"),
    },
    async ({ listName, completed, priority, dueBefore, dueAfter, searchText, limit }) => {
      try {
        let allReminders: Reminder[] = [];

        // Get lists to query
        const listsOutput = await executeAppleScript(listScripts.getAllLists);
        const lists = parseListsOutput(listsOutput);

        const targetLists = listName
          ? lists.filter((l) => l.name === listName)
          : lists;

        if (listName && targetLists.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    error: true,
                    code: "NOT_FOUND",
                    message: `List "${listName}" not found`,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        // Fetch reminders from each list
        for (const list of targetLists) {
          const script = reminderScripts.getRemindersFromList(list.name);
          const output = await executeAppleScript(script);
          const reminders = parseRemindersOutput(output, list.name);
          allReminders.push(...reminders);
        }

        // Apply filters
        let filtered = allReminders;

        if (completed !== undefined) {
          filtered = filtered.filter((r) => r.completed === completed);
        }

        if (priority !== undefined) {
          const priorityValue = PriorityMap[priority as PriorityName];
          filtered = filtered.filter((r) => r.priority === priorityValue);
        }

        if (dueBefore) {
          const beforeDate = new Date(dueBefore);
          filtered = filtered.filter(
            (r) => r.dueDate && new Date(r.dueDate) < beforeDate
          );
        }

        if (dueAfter) {
          const afterDate = new Date(dueAfter);
          filtered = filtered.filter(
            (r) => r.dueDate && new Date(r.dueDate) > afterDate
          );
        }

        if (searchText) {
          const search = searchText.toLowerCase();
          filtered = filtered.filter(
            (r) =>
              r.name.toLowerCase().includes(search) ||
              (r.body && r.body.toLowerCase().includes(search))
          );
        }

        // Apply limit
        const limited = filtered.slice(0, limit);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  total: limited.length,
                  reminders: limited,
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

  // Get single reminder by ID
  server.tool(
    "get_reminder",
    "Get a single reminder by its ID.",
    {
      id: z.string().min(1).describe("The unique identifier of the reminder"),
      listName: z
        .string()
        .min(1)
        .describe("The name of the list containing the reminder"),
    },
    async ({ id, listName }) => {
      try {
        const output = await executeAppleScript(
          reminderScripts.getReminderById(listName, id)
        );
        const reminder = parseReminderOutput(output, listName);

        if (!reminder) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    error: true,
                    code: "NOT_FOUND",
                    message: `Reminder not found`,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ reminder }, null, 2),
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

  // Create a reminder
  server.tool(
    "create_reminder",
    "Create a new reminder in the specified list.",
    {
      name: z
        .string()
        .min(1, "Reminder name is required")
        .max(255, "Name too long")
        .describe("Title of the reminder"),
      listName: z
        .string()
        .min(1)
        .describe("Name of the list to add the reminder to"),
      body: z
        .string()
        .max(10000, "Body too long")
        .optional()
        .describe("Notes/description for the reminder"),
      dueDate: z
        .string()
        .optional()
        .describe(
          "Due date with time (ISO 8601 format, e.g., '2025-01-15T14:00:00')"
        ),
      allDayDueDate: z
        .string()
        .optional()
        .describe("All-day due date without time (ISO 8601 date, e.g., '2025-01-15')"),
      remindMeDate: z
        .string()
        .optional()
        .describe("When to show alert notification (ISO 8601 format)"),
      priority: prioritySchema
        .default("none")
        .describe("Priority level"),
    },
    async ({ name, listName, body, dueDate, allDayDueDate, remindMeDate, priority }) => {
      try {
        const id = await executeAppleScript(
          reminderScripts.createReminder({
            listName,
            name,
            body,
            dueDate,
            allDayDueDate,
            remindMeDate,
            priority: priority as PriorityName,
          })
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Reminder "${name}" created successfully`,
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

  // Update a reminder
  server.tool(
    "update_reminder",
    "Update an existing reminder's properties. Only specified fields will be changed.",
    {
      id: z
        .string()
        .min(1)
        .describe("The unique identifier of the reminder to update"),
      listName: z
        .string()
        .min(1)
        .describe("The name of the list containing the reminder"),
      name: z
        .string()
        .min(1)
        .max(255)
        .optional()
        .describe("New title for the reminder"),
      body: z
        .string()
        .max(10000)
        .optional()
        .nullable()
        .describe("New notes/description. Set to null to clear."),
      dueDate: z
        .string()
        .optional()
        .nullable()
        .describe("New due date with time. Set to null to clear."),
      allDayDueDate: z
        .string()
        .optional()
        .nullable()
        .describe("New all-day due date. Set to null to clear."),
      remindMeDate: z
        .string()
        .optional()
        .nullable()
        .describe("New alert date. Set to null to clear."),
      priority: prioritySchema.optional().describe("New priority level"),
      completed: z.boolean().optional().describe("Set completion status"),
    },
    async ({
      id,
      listName,
      name,
      body,
      dueDate,
      allDayDueDate,
      remindMeDate,
      priority,
      completed,
    }) => {
      try {
        const updates: Record<string, unknown> = {};
        if (name !== undefined) updates.name = name;
        if (body !== undefined) updates.body = body;
        if (dueDate !== undefined) updates.dueDate = dueDate;
        if (allDayDueDate !== undefined) updates.allDayDueDate = allDayDueDate;
        if (remindMeDate !== undefined) updates.remindMeDate = remindMeDate;
        if (priority !== undefined) updates.priority = priority;
        if (completed !== undefined) updates.completed = completed;

        await executeAppleScript(
          reminderScripts.updateReminder(listName, id, updates as Parameters<typeof reminderScripts.updateReminder>[2])
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Reminder updated successfully`,
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

  // Delete a reminder
  server.tool(
    "delete_reminder",
    "Delete a reminder. This action cannot be undone.",
    {
      id: z
        .string()
        .min(1)
        .describe("The unique identifier of the reminder to delete"),
      listName: z
        .string()
        .min(1)
        .describe("The name of the list containing the reminder"),
    },
    async ({ id, listName }) => {
      try {
        await executeAppleScript(reminderScripts.deleteReminder(listName, id));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Reminder deleted successfully`,
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

  // Complete/uncomplete a reminder
  server.tool(
    "complete_reminder",
    "Mark a reminder as completed or incomplete.",
    {
      id: z.string().min(1).describe("The unique identifier of the reminder"),
      listName: z
        .string()
        .min(1)
        .describe("The name of the list containing the reminder"),
      completed: z
        .boolean()
        .default(true)
        .describe("true to mark complete, false to mark incomplete"),
    },
    async ({ id, listName, completed }) => {
      try {
        await executeAppleScript(
          reminderScripts.completeReminder(listName, id, completed)
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  success: true,
                  message: `Reminder marked as ${completed ? "completed" : "incomplete"}`,
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
