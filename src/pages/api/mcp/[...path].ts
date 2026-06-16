import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@supabase/supabase-js";
import type { NextApiRequest, NextApiResponse } from "next";
import { AsyncLocalStorage } from "node:async_hooks";

// We store the authorization token context so it can be accessed inside the tool handlers
const authContext = new AsyncLocalStorage<string | undefined>();

let globalServer: Server | null = null;
let globalTransport: SSEServerTransport | null = null;

function initializeServer() {
  if (globalServer) return;

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
    return;
  }

  // Create a base client that uses the token from the AsyncLocalStorage if available
  const getSupabaseClient = () => {
    const token = authContext.getStore();
    
    if (token) {
      // If a Bearer token is provided by Claude Web, authenticate as that specific user!
      // This enforces Row Level Security (RLS) so they can only access their own data.
      return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
        auth: { persistSession: false },
      });
    } else if (SUPABASE_SERVICE_ROLE_KEY) {
      // Fallback: Admin access (useful for local desktop testing if no token provided)
      return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      });
    } else {
      throw new Error("Unauthorized: No Bearer token provided, and no Service Role Key found.");
    }
  };

  const server = new Server(
    { name: "study-plan-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "list_study_plans",
          description: "List all study plans for the authenticated user",
          inputSchema: {
            type: "object",
            properties: {},
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
    try {
      const supabase = getSupabaseClient();

      if (request.params.name === "list_study_plans") {
        const { data, error } = await supabase.from("study_plans").select("*");
        if (error) throw error;
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      
      if (request.params.name === "get_study_plan") {
        const { id } = request.params.arguments as any;
        const { data, error } = await supabase.from("study_plans").select("*").eq("id", id).single();
        if (error) throw error;
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      }
      
      throw new Error(`Unknown tool: ${request.params.name}`);
    } catch (error: any) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
  });

  globalServer = server;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
        return res.status(500).json({ error: "Server failed to initialize." });
    }

    globalTransport = new SSEServerTransport("/api/mcp/message", res as any);
    await globalServer.connect(globalTransport);
    
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

    // Extract Bearer token from the request
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : undefined;

    // Run the transport handler within the auth context
    await authContext.run(token, async () => {
      await globalTransport!.handlePostMessage(req as any, res as any);
    });
    return;
  }

  return res.status(404).json({ error: "Not found" });
}
