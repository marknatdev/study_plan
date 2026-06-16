import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import express from "express";
import cors from "cors";

// Read environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const server = new Server(
  {
    name: "study-plan-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
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

server.setRequestHandler(CallToolRequestSchema, async (request) => {
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
    const { id } = request.params.arguments as any;
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

// Setup Express server for SSE
const app = express();
app.use(cors());
app.use(express.json());

let transport: SSEServerTransport | null = null;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
  console.log("Client connected via SSE");
});

app.post("/message", async (req, res) => {
  if (!transport) {
    res.status(400).send("No active SSE connection");
    return;
  }
  await transport.handlePostMessage(req, res);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Study Plan MCP Server running on SSE at http://localhost:${PORT}`);
  console.log(`- SSE Endpoint: http://localhost:${PORT}/sse`);
  console.log(`- Message Endpoint: http://localhost:${PORT}/message`);
});
