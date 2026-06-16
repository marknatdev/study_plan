import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";

// We store these globally so they survive across requests on the same serverless instance.
// WARNING: On Vercel Serverless, instances are ephemeral. While this works well for a 
// single active user (since Vercel reuses the warm instance), heavy concurrent traffic 
// might spawn multiple instances, breaking the SSE transport state.
let globalServer: Server | null = null;
let globalTransport: SSEServerTransport | null = null;

function initializeServer() {
  if (globalServer) return;

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const server = new Server(
    { name: "study-plan-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "list_study_plans",
          description: "List all study plans in the database",
          inputSchema: {
            type: "object",
            properties: {
              user_id: { type: "string", description: "Optional UUID to filter by user" },
            },
          },
        },
        {
          name: "get_study_plan",
          description: "Get a specific study plan by ID",
          inputSchema: {
            type: "object",
            properties: { id: { type: "string", description: "UUID of the study plan" } },
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
      if (user_id && typeof user_id === "string") {
        query = query.eq("user_id", user_id);
      }
      const { data, error } = await query;
      if (error) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    if (request.params.name === "get_study_plan") {
      const { id } = request.params.arguments as any;
      const { data, error } = await supabase.from("study_plans").select("*").eq("id", id).single();
      if (error) {
        return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
      }
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  globalServer = server;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Setup CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { path } = req.query;
  const endpoint = Array.isArray(path) ? path[0] : path;

  // Endpoint 1: /api/mcp/sse (GET) -> Initializes SSE connection
  if (endpoint === "sse" && req.method === "GET") {
    initializeServer();
    if (!globalServer) {
        return res.status(500).json({ error: "Server failed to initialize. Check env variables." });
    }

    // SSEServerTransport writes to the ServerResponse directly
    globalTransport = new SSEServerTransport("/api/mcp/message", res as any);
    await globalServer.connect(globalTransport);
    
    // Prevent Next.js from automatically resolving the response
    req.on("close", () => {
      globalTransport = null;
    });
    return;
  }

  // Endpoint 2: /api/mcp/message (POST) -> Handles incoming RPC messages
  if (endpoint === "message" && req.method === "POST") {
    if (!globalTransport) {
      return res.status(400).json({ error: "No active SSE connection on this instance." });
    }
    // We pass req and res to the transport so it can read the message body
    await globalTransport.handlePostMessage(req as any, res as any);
    return;
  }

  return res.status(404).json({ error: "Not found" });
}
