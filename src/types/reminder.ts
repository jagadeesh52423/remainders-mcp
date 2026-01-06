// Priority levels in macOS Reminders (AppleScript values)
export type PriorityValue = 0 | 1 | 5 | 9;

export const PriorityMap = {
  none: 0,
  high: 1,
  medium: 5,
  low: 9,
} as const;

export type PriorityName = keyof typeof PriorityMap;

// Core Reminder interface matching AppleScript properties
export interface Reminder {
  id: string;
  name: string;
  body: string | null;
  dueDate: string | null;
  allDayDueDate: string | null;
  remindMeDate: string | null;
  priority: PriorityValue;
  completed: boolean;
  completionDate: string | null;
  creationDate: string;
  modificationDate: string;
  listId: string;
  listName: string;
}

// Reminder List interface
export interface ReminderList {
  id: string;
  name: string;
  reminderCount: number;
}

// Input for creating a reminder
export interface CreateReminderInput {
  name: string;
  listName: string;
  body?: string;
  dueDate?: string;
  allDayDueDate?: string;
  remindMeDate?: string;
  priority?: PriorityName;
}

// Input for updating a reminder
export interface UpdateReminderInput {
  id: string;
  listName: string;
  name?: string;
  body?: string | null;
  dueDate?: string | null;
  allDayDueDate?: string | null;
  remindMeDate?: string | null;
  priority?: PriorityName;
  completed?: boolean;
}

// Filter criteria for querying reminders
export interface ReminderFilter {
  listName?: string;
  completed?: boolean;
  priority?: PriorityName;
  dueBefore?: string;
  dueAfter?: string;
  searchText?: string;
  limit?: number;
}

// Operation result
export interface OperationResult {
  success: boolean;
  message: string;
  id?: string;
}

export interface BatchOperationResult {
  success: boolean;
  totalProcessed: number;
  succeeded: number;
  failed: number;
  results: OperationResult[];
}
