import { Agent, VoltAgent, MCPConfiguration } from "@voltagent/core";
import { GoogleGenAIProvider } from "@voltagent/google-ai";
import { config } from "dotenv";
import path from "node:path";

config();

const llm = new GoogleGenAIProvider({ apiKey: process.env.API_KEY || "" });
const model = "gemini-2.0-flash";

const fileSystemMCP = new MCPConfiguration({
  servers: {
    filesystem: {
      type: "stdio",
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        path.resolve("./data"),
      ],
    },
  },
});

const tools = await fileSystemMCP.getTools();

const subAgent = new Agent({
  name: "File Manager Agent",
  description: `You are a file manager agent that can help with a range of tools. You can use your tools to help the user with any file operation task asked.
  Each tool has a specific use case and you can use them to help the user with your tasks. You are an sub agent from the supervisor agent and you will be 
  called by the supervisor agent to help with the user's request when the user asks something related to file operations. You will use your tools to help the user 
  with their request and you will return the result to the supervisor agent. You are allowed to do any file related task inside the allowed directory configured in your tools configuration. 
  You can use the following tools to help the user:
      
  1. Use read_file to read a file.
  2. Use read_multiple_files to read multiple files.
  3. Use write_file to write a file.
  4. Use edit_file to edit a file.
  5. Use create_directory to create a directory.
  6. Use list_directory to list a directory.
  7. Use directory_tree to get the directory tree.
  8. Use move_file to move a file.
  9. Use search_files to search for a file.
  10. Use get_file_info to get the file info.
  11. Use list_allowed_directories to list the allowed directories.
  `,
  llm,
  model,
  tools,
});

const supervisorAgent = new Agent({
  name: "Supervisor Agent",
  description: `You are a Supervisor Agent and assistant that can help with a wide range of tasks. You can delegate tasks to your sub agents when
  you need to. Each sub agent has a specific role and tools and you can use them to help the user with your tasks. When the user asks you to do something, 
  you will try to understand what the user wants and delegate the task to the appropriate agent. You have the following sub agents to help you:

  1. Use the File Manager Agent to help the user with file operations when the user asks to create, read, update or delete a file.

  If the user asks you to do something that is not related to the sub agents, you can try to help the user with your own tools or you can ask the user to 
  rephrase their request.
  `,
  llm,
  model,
  subAgents: [subAgent],
});

new VoltAgent({
  agents: {
    supervisorAgent,
  },
});
