import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { executeAppleScript } from "../applescript/executor.js";
import { reminderScripts } from "../applescript/scripts/reminders.js";
import { formatError } from "../utils/errors.js";
import { PriorityName, OperationResult, BatchOperationResult } from "../types/reminder.js";

const prioritySchema = z.enum(["none", "low", "medium", "high"]);

const createReminderInputSchema = z.object({
  name: z.string().min(1).max(255),
  listName: z.string().min(1),
  body: z.string().max(10000).optional(),
  dueDate: z.string().optional(),
  allDayDueDate: z.string().optional(),
  remindMeDate: z.string().optional(),
  priority: prioritySchema.optional(),
});

const updateReminderInputSchema = z.object({
  id: z.string().min(1),
  listName: z.string().min(1),
  name: z.string().min(1).max(255).optional(),
  body: z.string().max(10000).optional().nullable(),
  dueDate: z.string().optional().nullable(),
  allDayDueDate: z.string().optional().nullable(),
  remindMeDate: z.string().optional().nullable(),
  priority: prioritySchema.optional(),
  completed: z.boolean().optional(),
});

const reminderRefSchema = z.object({
  id: z.string().min(1),
  listName: z.string().min(1),
});

export function registerBatchTools(server: McpServer) {
  // Batch create reminders
  server.tool(
    "batch_create_reminders",
    "Create multiple reminders at once. More efficient than creating one at a time.",
    {
      reminders: z
        .array(createReminderInputSchema)
        .min(1, "At least one reminder required")
        .max(100, "Maximum 100 reminders per batch")
        .describe("Array of reminders to create (max 100)"),
    },
    async ({ reminders }) => {
      const results: OperationResult[] = [];
      let succeeded = 0;
      let failed = 0;

      for (const reminder of reminders) {
        try {
          const id = await executeAppleScript(
            reminderScripts.createReminder({
              listName: reminder.listName,
              name: reminder.name,
              body: reminder.body,
              dueDate: reminder.dueDate,
              allDayDueDate: reminder.allDayDueDate,
              remindMeDate: reminder.remindMeDate,
              priority: reminder.priority as PriorityName | undefined,
            })
          );

          results.push({
            success: true,
            message: `Created "${reminder.name}"`,
            id: id.trim(),
          });
          succeeded++;
        } catch (error) {
          const errorInfo = formatError(error);
          results.push({
            success: false,
            message: `Failed to create "${reminder.name}": ${errorInfo.message}`,
          });
          failed++;
        }
      }

      const result: BatchOperationResult = {
        success: failed === 0,
        totalProcessed: reminders.length,
        succeeded,
        failed,
        results,
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: failed > 0 && succeeded === 0,
      };
    }
  );

  // Batch update reminders
  server.tool(
    "batch_update_reminders",
    "Update multiple reminders at once. More efficient than updating one at a time.",
    {
      reminders: z
        .array(updateReminderInputSchema)
        .min(1, "At least one reminder required")
        .max(100, "Maximum 100 reminders per batch")
        .describe("Array of reminder updates (max 100)"),
    },
    async ({ reminders }) => {
      const results: OperationResult[] = [];
      let succeeded = 0;
      let failed = 0;

      for (const reminder of reminders) {
        try {
          const updates: Record<string, unknown> = {};
          if (reminder.name !== undefined) updates.name = reminder.name;
          if (reminder.body !== undefined) updates.body = reminder.body;
          if (reminder.dueDate !== undefined) updates.dueDate = reminder.dueDate;
          if (reminder.allDayDueDate !== undefined)
            updates.allDayDueDate = reminder.allDayDueDate;
          if (reminder.remindMeDate !== undefined)
            updates.remindMeDate = reminder.remindMeDate;
          if (reminder.priority !== undefined) updates.priority = reminder.priority;
          if (reminder.completed !== undefined) updates.completed = reminder.completed;

          await executeAppleScript(
            reminderScripts.updateReminder(
              reminder.listName,
              reminder.id,
              updates as Parameters<typeof reminderScripts.updateReminder>[2]
            )
          );

          results.push({
            success: true,
            message: `Updated reminder ${reminder.id}`,
            id: reminder.id,
          });
          succeeded++;
        } catch (error) {
          const errorInfo = formatError(error);
          results.push({
            success: false,
            message: `Failed to update reminder ${reminder.id}: ${errorInfo.message}`,
          });
          failed++;
        }
      }

      const result: BatchOperationResult = {
        success: failed === 0,
        totalProcessed: reminders.length,
        succeeded,
        failed,
        results,
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: failed > 0 && succeeded === 0,
      };
    }
  );

  // Batch complete reminders
  server.tool(
    "batch_complete_reminders",
    "Mark multiple reminders as completed or incomplete at once.",
    {
      reminders: z
        .array(reminderRefSchema)
        .min(1, "At least one reminder required")
        .max(100, "Maximum 100 reminders per batch")
        .describe("Array of reminders to complete"),
      completed: z
        .boolean()
        .default(true)
        .describe("true to mark complete, false to mark incomplete"),
    },
    async ({ reminders, completed }) => {
      const results: OperationResult[] = [];
      let succeeded = 0;
      let failed = 0;

      for (const reminder of reminders) {
        try {
          await executeAppleScript(
            reminderScripts.completeReminder(
              reminder.listName,
              reminder.id,
              completed
            )
          );

          results.push({
            success: true,
            message: `Marked reminder ${reminder.id} as ${completed ? "completed" : "incomplete"}`,
            id: reminder.id,
          });
          succeeded++;
        } catch (error) {
          const errorInfo = formatError(error);
          results.push({
            success: false,
            message: `Failed to update reminder ${reminder.id}: ${errorInfo.message}`,
          });
          failed++;
        }
      }

      const result: BatchOperationResult = {
        success: failed === 0,
        totalProcessed: reminders.length,
        succeeded,
        failed,
        results,
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
        isError: failed > 0 && succeeded === 0,
      };
    }
  );
}
