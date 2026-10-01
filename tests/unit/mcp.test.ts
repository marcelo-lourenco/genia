import assert from "node:assert/strict";
import test from "node:test";
import { mcpToolsRegistry } from "@/ai/mcp/tools";

test("MCP Registry contains all required genealogical tools", () => {
  const expectedTools = [
    "search_persons",
    "get_person_details",
    "get_tree_ancestors",
    "get_dgs_waypoints",
    "analyze_manuscript_image",
  ];

  for (const name of expectedTools) {
    assert.ok(mcpToolsRegistry[name], `Tool ${name} must be registered`);
    assert.ok(mcpToolsRegistry[name].description.length > 10, `Tool ${name} has description`);
    assert.ok(typeof mcpToolsRegistry[name].handler === "function", `Tool ${name} has handler`);
  }
});

test("MCP search_persons validates mandatory surname and accepts optional fields", () => {
  const schema = mcpToolsRegistry.search_persons.inputSchema;

  const valid = schema.safeParse({
    surname: "Colosovschi",
    givenName: "Ivan",
    birthDate: "1909",
    birthPlace: "Beșghioz",
  });
  assert.equal(valid.success, true);

  const invalid = schema.safeParse({
    givenName: "Ivan",
    // missing surname
  });
  assert.equal(invalid.success, false);
});

test("MCP get_dgs_waypoints validates dgsNumber", () => {
  const schema = mcpToolsRegistry.get_dgs_waypoints.inputSchema;

  const valid = schema.safeParse({ dgsNumber: "005610797" });
  assert.equal(valid.success, true);

  const invalid = schema.safeParse({});
  assert.equal(invalid.success, false);
});
