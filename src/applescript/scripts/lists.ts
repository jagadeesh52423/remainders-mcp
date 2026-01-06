import { sanitizeForAppleScript } from "../../utils/sanitize.js";

export const listScripts = {
  getAllLists: `
tell application "Reminders"
  set output to ""
  repeat with aList in lists
    set listId to id of aList
    set listName to name of aList
    set reminderCount to count of reminders of aList
    set output to output & listId & "|||" & listName & "|||" & reminderCount & linefeed
  end repeat
  return output
end tell
`,

  createList: (name: string) => `
tell application "Reminders"
  set newList to make new list with properties {name:"${sanitizeForAppleScript(name)}"}
  return id of newList
end tell
`,

  deleteList: (name: string) => `
tell application "Reminders"
  delete list "${sanitizeForAppleScript(name)}"
  return "success"
end tell
`,

  renameList: (currentName: string, newName: string) => `
tell application "Reminders"
  set name of list "${sanitizeForAppleScript(currentName)}" to "${sanitizeForAppleScript(newName)}"
  return "success"
end tell
`,

  getListByName: (name: string) => `
tell application "Reminders"
  set targetList to list "${sanitizeForAppleScript(name)}"
  set listId to id of targetList
  set listName to name of targetList
  set reminderCount to count of reminders of targetList
  return listId & "|||" & listName & "|||" & reminderCount
end tell
`,
};
