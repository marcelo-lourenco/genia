import { type NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { mcpToolsRegistry } from "@/ai/mcp/tools";

/**
 * GET /api/mcp - Lists all registered MCP tools and their parameter schemas
 */
export async function GET() {
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
      parameters: {
        type: "object",
        properties,
        required,
      },
    };
  });

  return NextResponse.json({
    name: "familysearch-genealogy-agent",
    version: "1.0.0",
    protocol: "mcp-1.0",
    tools,
  });
}

/**
 * POST /api/mcp - Executes a registered MCP tool directly
 * Payload: { tool: string, arguments: Record<string, unknown> }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool: toolName, arguments: args } = body;

    if (!toolName || typeof toolName !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'tool' name" }, { status: 400 });
    }

    const tool = mcpToolsRegistry[toolName];
    if (!tool) {
      return NextResponse.json({ error: `Tool '${toolName}' not found` }, { status: 404 });
    }

    const validatedArgs = tool.inputSchema.parse(args || {});
    const result = await tool.handler(validatedArgs);

    return NextResponse.json({
      success: true,
      tool: toolName,
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to execute MCP tool";
    console.error("MCP tool execution error:", error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
