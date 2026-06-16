"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const supabase_js_1 = require("@supabase/supabase-js");
// Read environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
    process.exit(1);
}
const supabase = (0, supabase_js_1.createClient)(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
});
const server = new index_js_1.Server({
    name: "study-plan-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// Define tools
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "list_study_plans",
                description: "List all study plans in the database",
                inputSchema: {
                    type: "object",
                    properties: {
                        user_id: { type: "string", description: "Optional UUID to filter by user" }
                    },
                },
            },
            {
                name: "get_study_plan",
                description: "Get a specific study plan by ID",
                inputSchema: {
                    type: "object",
                    properties: {
                        id: { type: "string", description: "UUID of the study plan" },
                    },
                    required: ["id"],
                },
            },
        ],
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    if (request.params.name === "list_study_plans") {
        const { user_id } = request.params.arguments || {};
        let query = supabase.from("study_plans").select("*");
        if (user_id && typeof user_id === 'string') {
            query = query.eq('user_id', user_id);
        }
        const { data, error } = await query;
        if (error) {
            return {
                content: [{ type: "text", text: `Error fetching study plans: ${error.message}` }],
                isError: true,
            };
        }
        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
    }
    if (request.params.name === "get_study_plan") {
        const { id } = request.params.arguments;
        const { data, error } = await supabase.from("study_plans").select("*").eq("id", id).single();
        if (error) {
            return {
                content: [{ type: "text", text: `Error fetching study plan: ${error.message}` }],
                isError: true,
            };
        }
        return {
            content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        };
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
});
// Start the server
async function run() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Study Plan MCP Server running on stdio");
}
run().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map