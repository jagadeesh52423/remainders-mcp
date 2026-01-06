import {
  sanitizeForAppleScript,
  toAppleScriptDate,
  toAppleScriptAllDayDate,
} from "../../utils/sanitize.js";
import { PriorityMap, PriorityName } from "../../types/reminder.js";

export const reminderScripts = {
  getRemindersFromList: (listName: string) => `
tell application "Reminders"
  set targetList to list "${sanitizeForAppleScript(listName)}"
  set listId to id of targetList
  set output to ""
  repeat with r in reminders of targetList
    set rId to id of r
    set rName to name of r
    set rBody to body of r
    if rBody is missing value then set rBody to ""

    set rDueDate to due date of r
    if rDueDate is missing value then
      set rDueDateStr to ""
    else
      set rDueDateStr to (rDueDate as string)
    end if

    set rAllDayDueDate to allday due date of r
    if rAllDayDueDate is missing value then
      set rAllDayDueDateStr to ""
    else
      set rAllDayDueDateStr to (rAllDayDueDate as string)
    end if

    set rRemindMeDate to remind me date of r
    if rRemindMeDate is missing value then
      set rRemindMeDateStr to ""
    else
      set rRemindMeDateStr to (rRemindMeDate as string)
    end if

    set rPriority to priority of r
    set rCompleted to completed of r

    set rCompletionDate to completion date of r
    if rCompletionDate is missing value then
      set rCompletionDateStr to ""
    else
      set rCompletionDateStr to (rCompletionDate as string)
    end if

    set rCreationDate to (creation date of r) as string
    set rModDate to (modification date of r) as string

    set output to output & rId & "|||" & rName & "|||" & rBody & "|||" & rDueDateStr & "|||" & rAllDayDueDateStr & "|||" & rRemindMeDateStr & "|||" & rPriority & "|||" & rCompleted & "|||" & rCompletionDateStr & "|||" & rCreationDate & "|||" & rModDate & "|||" & listId & linefeed
  end repeat
  return output
end tell
`,

  getReminderById: (listName: string, reminderId: string) => `
tell application "Reminders"
  set targetList to list "${sanitizeForAppleScript(listName)}"
  set listId to id of targetList
  set r to reminder id "${reminderId}" of targetList

  set rId to id of r
  set rName to name of r
  set rBody to body of r
  if rBody is missing value then set rBody to ""

  set rDueDate to due date of r
  if rDueDate is missing value then
    set rDueDateStr to ""
  else
    set rDueDateStr to (rDueDate as string)
  end if

  set rAllDayDueDate to allday due date of r
  if rAllDayDueDate is missing value then
    set rAllDayDueDateStr to ""
  else
    set rAllDayDueDateStr to (rAllDayDueDate as string)
  end if

  set rRemindMeDate to remind me date of r
  if rRemindMeDate is missing value then
    set rRemindMeDateStr to ""
  else
    set rRemindMeDateStr to (rRemindMeDate as string)
  end if

  set rPriority to priority of r
  set rCompleted to completed of r

  set rCompletionDate to completion date of r
  if rCompletionDate is missing value then
    set rCompletionDateStr to ""
  else
    set rCompletionDateStr to (rCompletionDate as string)
  end if

  set rCreationDate to (creation date of r) as string
  set rModDate to (modification date of r) as string

  return rId & "|||" & rName & "|||" & rBody & "|||" & rDueDateStr & "|||" & rAllDayDueDateStr & "|||" & rRemindMeDateStr & "|||" & rPriority & "|||" & rCompleted & "|||" & rCompletionDateStr & "|||" & rCreationDate & "|||" & rModDate & "|||" & listId
end tell
`,

  createReminder: (params: {
    listName: string;
    name: string;
    body?: string;
    dueDate?: string;
    allDayDueDate?: string;
    remindMeDate?: string;
    priority?: PriorityName;
  }) => {
    const properties: string[] = [
      `name:"${sanitizeForAppleScript(params.name)}"`,
    ];

    if (params.body) {
      properties.push(`body:"${sanitizeForAppleScript(params.body)}"`);
    }
    if (params.dueDate) {
      properties.push(`due date:date "${toAppleScriptDate(params.dueDate)}"`);
    }
    if (params.allDayDueDate) {
      properties.push(
        `allday due date:date "${toAppleScriptAllDayDate(params.allDayDueDate)}"`
      );
    }
    if (params.remindMeDate) {
      properties.push(
        `remind me date:date "${toAppleScriptDate(params.remindMeDate)}"`
      );
    }
    if (params.priority && params.priority !== "none") {
      properties.push(`priority:${PriorityMap[params.priority]}`);
    }

    return `
tell application "Reminders"
  tell list "${sanitizeForAppleScript(params.listName)}"
    set newReminder to make new reminder with properties {${properties.join(", ")}}
    return id of newReminder
  end tell
end tell
`;
  },

  updateReminder: (
    listName: string,
    reminderId: string,
    updates: {
      name?: string;
      body?: string | null;
      dueDate?: string | null;
      allDayDueDate?: string | null;
      remindMeDate?: string | null;
      priority?: PriorityName;
      completed?: boolean;
    }
  ) => {
    const setStatements: string[] = [];

    if (updates.name !== undefined) {
      setStatements.push(
        `set name of targetReminder to "${sanitizeForAppleScript(updates.name)}"`
      );
    }
    if (updates.body !== undefined) {
      if (updates.body === null) {
        setStatements.push(`set body of targetReminder to missing value`);
      } else {
        setStatements.push(
          `set body of targetReminder to "${sanitizeForAppleScript(updates.body)}"`
        );
      }
    }
    if (updates.dueDate !== undefined) {
      if (updates.dueDate === null) {
        setStatements.push(`set due date of targetReminder to missing value`);
      } else {
        setStatements.push(
          `set due date of targetReminder to date "${toAppleScriptDate(updates.dueDate)}"`
        );
      }
    }
    if (updates.allDayDueDate !== undefined) {
      if (updates.allDayDueDate === null) {
        setStatements.push(
          `set allday due date of targetReminder to missing value`
        );
      } else {
        setStatements.push(
          `set allday due date of targetReminder to date "${toAppleScriptAllDayDate(updates.allDayDueDate)}"`
        );
      }
    }
    if (updates.remindMeDate !== undefined) {
      if (updates.remindMeDate === null) {
        setStatements.push(
          `set remind me date of targetReminder to missing value`
        );
      } else {
        setStatements.push(
          `set remind me date of targetReminder to date "${toAppleScriptDate(updates.remindMeDate)}"`
        );
      }
    }
    if (updates.priority !== undefined) {
      setStatements.push(
        `set priority of targetReminder to ${PriorityMap[updates.priority]}`
      );
    }
    if (updates.completed !== undefined) {
      setStatements.push(
        `set completed of targetReminder to ${updates.completed}`
      );
    }

    return `
tell application "Reminders"
  tell list "${sanitizeForAppleScript(listName)}"
    set targetReminder to reminder id "${reminderId}"
    ${setStatements.join("\n    ")}
    return "success"
  end tell
end tell
`;
  },

  deleteReminder: (listName: string, reminderId: string) => `
tell application "Reminders"
  tell list "${sanitizeForAppleScript(listName)}"
    delete reminder id "${reminderId}"
    return "success"
  end tell
end tell
`,

  completeReminder: (
    listName: string,
    reminderId: string,
    completed: boolean
  ) => `
tell application "Reminders"
  tell list "${sanitizeForAppleScript(listName)}"
    set completed of reminder id "${reminderId}" to ${completed}
    return "success"
  end tell
end tell
`,
};
