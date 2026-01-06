import {
  Reminder,
  ReminderList,
  PriorityValue,
} from "../types/reminder.js";
import { fromAppleScriptDate } from "../utils/sanitize.js";

/**
 * Parse the output of getAllLists AppleScript
 */
export function parseListsOutput(output: string): ReminderList[] {
  if (!output.trim()) return [];

  return output
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [id, name, countStr] = line.split("|||");
      return {
        id: id?.trim() || "",
        name: name?.trim() || "",
        reminderCount: parseInt(countStr?.trim() || "0", 10) || 0,
      };
    });
}

/**
 * Parse the output of getRemindersFromList AppleScript
 */
export function parseRemindersOutput(
  output: string,
  listName: string
): Reminder[] {
  if (!output.trim()) return [];

  return output
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|||");
      const [
        id,
        name,
        body,
        dueDateStr,
        allDayDueDateStr,
        remindMeDateStr,
        priorityStr,
        completedStr,
        completionDateStr,
        creationDateStr,
        modDateStr,
        listId,
      ] = parts;

      return {
        id: id?.trim() || "",
        name: name?.trim() || "",
        body: body?.trim() || null,
        dueDate: fromAppleScriptDate(dueDateStr || ""),
        allDayDueDate: fromAppleScriptDate(allDayDueDateStr || ""),
        remindMeDate: fromAppleScriptDate(remindMeDateStr || ""),
        priority: (parseInt(priorityStr?.trim() || "0", 10) || 0) as PriorityValue,
        completed: completedStr?.trim() === "true",
        completionDate: fromAppleScriptDate(completionDateStr || ""),
        creationDate: fromAppleScriptDate(creationDateStr || "") || new Date().toISOString(),
        modificationDate: fromAppleScriptDate(modDateStr || "") || new Date().toISOString(),
        listId: listId?.trim() || "",
        listName: listName,
      };
    });
}

/**
 * Parse single reminder output
 */
export function parseReminderOutput(
  output: string,
  listName: string
): Reminder | null {
  if (!output.trim()) return null;

  const parts = output.trim().split("|||");
  const [
    id,
    name,
    body,
    dueDateStr,
    allDayDueDateStr,
    remindMeDateStr,
    priorityStr,
    completedStr,
    completionDateStr,
    creationDateStr,
    modDateStr,
    listId,
  ] = parts;

  return {
    id: id?.trim() || "",
    name: name?.trim() || "",
    body: body?.trim() || null,
    dueDate: fromAppleScriptDate(dueDateStr || ""),
    allDayDueDate: fromAppleScriptDate(allDayDueDateStr || ""),
    remindMeDate: fromAppleScriptDate(remindMeDateStr || ""),
    priority: (parseInt(priorityStr?.trim() || "0", 10) || 0) as PriorityValue,
    completed: completedStr?.trim() === "true",
    completionDate: fromAppleScriptDate(completionDateStr || ""),
    creationDate: fromAppleScriptDate(creationDateStr || "") || new Date().toISOString(),
    modificationDate: fromAppleScriptDate(modDateStr || "") || new Date().toISOString(),
    listId: listId?.trim() || "",
    listName: listName,
  };
}

/**
 * Parse single list output
 */
export function parseListOutput(output: string): ReminderList | null {
  if (!output.trim()) return null;

  const [id, name, countStr] = output.trim().split("|||");
  return {
    id: id?.trim() || "",
    name: name?.trim() || "",
    reminderCount: parseInt(countStr?.trim() || "0", 10) || 0,
  };
}
