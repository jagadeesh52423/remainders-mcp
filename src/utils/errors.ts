export class RemindersMcpError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = "RemindersMcpError";
  }
}

export class AppleScriptError extends RemindersMcpError {
  constructor(message: string) {
    super(message, "APPLESCRIPT_ERROR", true);
    this.name = "AppleScriptError";
  }
}

export class PermissionError extends RemindersMcpError {
  constructor(message: string) {
    super(message, "PERMISSION_DENIED", false);
    this.name = "PermissionError";
  }
}

export class TimeoutError extends RemindersMcpError {
  constructor(message: string) {
    super(message, "TIMEOUT", true);
    this.name = "TimeoutError";
  }
}

export class NotFoundError extends RemindersMcpError {
  constructor(resourceType: string, identifier: string) {
    super(`${resourceType} not found: ${identifier}`, "NOT_FOUND", true);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends RemindersMcpError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", true);
    this.name = "ValidationError";
  }
}

export interface ErrorResponse {
  error: true;
  code: string;
  message: string;
  recoverable: boolean;
}

export function formatError(error: unknown): ErrorResponse {
  if (error instanceof RemindersMcpError) {
    return {
      error: true,
      code: error.code,
      message: error.message,
      recoverable: error.recoverable,
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    error: true,
    code: "UNKNOWN_ERROR",
    message: message,
    recoverable: false,
  };
}
