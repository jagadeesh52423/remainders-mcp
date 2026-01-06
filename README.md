# Reminders MCP Server

An MCP (Model Context Protocol) server for interacting with macOS Reminders app via AppleScript.

## Requirements

- macOS
- Node.js >= 18.0.0
- Access to macOS Reminders app

## Installation

```bash
npm install -g reminders-mcp
```

Or use directly with npx:

```bash
npx reminders-mcp
```

## Usage

### As an MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "reminders": {
      "command": "npx",
      "args": ["reminders-mcp"]
    }
  }
}
```

Or if installed globally:

```json
{
  "mcpServers": {
    "reminders": {
      "command": "reminders-mcp"
    }
  }
}
```

### Development

```bash
git clone https://github.com/jagadeesh52423/remainders-mcp.git
cd remainders-mcp
npm install
npm run dev        # Run with tsx
npm run inspector  # Run with MCP inspector
```

## Available Tools

### Lists

| Tool | Description |
|------|-------------|
| `list_reminder_lists` | Get all reminder lists with names, IDs, and counts |
| `create_reminder_list` | Create a new reminder list |
| `delete_reminder_list` | Delete a list and all its reminders |
| `rename_reminder_list` | Rename an existing list |

### Reminders

| Tool | Description |
|------|-------------|
| `get_reminders` | Get reminders with filtering (list, status, priority, date range, search) |
| `get_reminder` | Get a single reminder by ID |
| `create_reminder` | Create a new reminder |
| `update_reminder` | Update reminder properties |
| `delete_reminder` | Delete a reminder |
| `complete_reminder` | Mark reminder as completed/incomplete |

### Batch Operations

| Tool | Description |
|------|-------------|
| `batch_create_reminders` | Create multiple reminders at once (max 100) |
| `batch_update_reminders` | Update multiple reminders at once (max 100) |
| `batch_complete_reminders` | Complete/uncomplete multiple reminders (max 100) |

## License

MIT
