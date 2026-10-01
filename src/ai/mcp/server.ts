import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import { mcpToolsRegistry } from "./tools";

/**
 * Creates and initializes the FamilySearch MCP Server
 */
export function createFamilySearchMcpServer() {
  const server = new Server(
    {
      name: "familysearch-genealogy-agent",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  // Register tools list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = Object.values(mcpToolsRegistry).map((tool) => {
      const shape = tool.inputSchema.shape;
      const properties: Record<string, { type: string; description?: string }> = {};
      const required: string[] = [];

      for (const [key, schema] of Object.entries(shape) as [string, z.ZodTypeAny][]) {
        properties[key] = {
          type: schema._def?.typeName?.toLowerCase().replace("zod", "") || "string",
          description: schema.description,
        };
        if (!schema.isOptional()) {
          required.push(key);
        }
      }

      return {
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: "object" as const,
          properties,
          required,
        },
      };
    });

    return { tools };
  });

  // Register tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = mcpToolsRegistry[name];

    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    try {
      const validatedArgs = tool.inputSchema.parse(args || {});
      const result = await tool.handler(validatedArgs);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Tool execution failed: ${errorMessage}`,
          },
        ],
      };
    }
  });

  return server;
}
