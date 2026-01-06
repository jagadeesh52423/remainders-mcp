import { exec } from "node:child_process";
import { promisify } from "node:util";
import {
  AppleScriptError,
  PermissionError,
  TimeoutError,
} from "../utils/errors.js";

const execAsync = promisify(exec);

export interface ExecutorOptions {
  timeout?: number;
}

/**
 * Execute AppleScript using osascript command
 */
export async function executeAppleScript(
  script: string,
  options: ExecutorOptions = {}
): Promise<string> {
  const { timeout = 30000 } = options;

  // Use heredoc style to avoid shell escaping issues
  const command = `osascript <<'APPLESCRIPT_END'
${script}
APPLESCRIPT_END`;

  try {
    const { stdout, stderr } = await execAsync(command, {
      timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
    });

    // AppleScript sometimes outputs to stderr for non-errors
    if (stderr && !stdout && stderr.includes("error")) {
      throw new AppleScriptError(stderr);
    }

    return stdout.trim();
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException & {
      killed?: boolean;
      signal?: string;
      stderr?: string;
    };

    // Handle timeout
    if (err.killed && err.signal === "SIGTERM") {
      throw new TimeoutError(
        `AppleScript execution timed out after ${timeout}ms`
      );
    }

    // Handle permission errors
    const errorMessage = err.message || err.stderr || "";
    if (
      errorMessage.includes("not allowed") ||
      errorMessage.includes("permission") ||
      errorMessage.includes("(-1743)")
    ) {
      throw new PermissionError(
        "Reminders access denied. Please grant permission in System Preferences > Privacy & Security > Automation"
      );
    }

    // Handle list/reminder not found
    if (
      errorMessage.includes("Can't get list") ||
      errorMessage.includes("Can't get reminder")
    ) {
      throw new AppleScriptError(errorMessage);
    }

    throw new AppleScriptError(errorMessage || "Unknown AppleScript error");
  }
}

/**
 * Check if we have permission to access Reminders
 */
export async function checkRemindersPermission(): Promise<boolean> {
  try {
    await executeAppleScript(
      `
      tell application "Reminders"
        count of lists
      end tell
    `,
      { timeout: 5000 }
    );
    return true;
  } catch (error) {
    if (error instanceof PermissionError) {
      return false;
    }
    // Other errors might indicate permission is OK but something else failed
    return true;
  }
}
