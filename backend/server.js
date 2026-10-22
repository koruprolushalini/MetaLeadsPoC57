
const express = require("express");
const { WebSocketServer, WebSocket } = require("ws");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Track processed lead IDs during this server session
const processedLeadIds = new Set();

// Store the latest 20 leads in memory
const recentLeads = [];
const MAX_RECENT_LEADS = 20;

// Fetch lead details from Meta
async function fetchLeadDetails(leadId) {
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("META_PAGE_ACCESS_TOKEN is missing from .env");
  }

  const url = new URL(
    `https://graph.facebook.com/v26.0/${leadId}`
  );
  url.searchParams.set("fields", "created_time,field_data");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    const code = data.error?.code;
    const message =
      data.error?.message || "Failed to fetch lead details";

    throw new Error(
      code ? `Meta API error ${code}: ${message}` : message
    );
  }

  return data;
}

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Meta Leads backend is running!",
  });
});

// Meta webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === process.env.META_VERIFY_TOKEN
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// Receive Meta webhook notifications
app.post("/webhook", (req, res) => {
  // Acknowledge Meta promptly
  res.sendStatus(200);

  // Process the notification after responding
  void processWebhook(req.body);
});

async function processWebhook(body) {
  for (const entry of body?.entry || []) {
    if (!entry) continue;

    for (const change of entry.changes || []) {
      if (!change || change.field !== "leadgen") continue;

      const leadId = change.value?.leadgen_id;
      if (!leadId) continue;

      if (processedLeadIds.has(leadId)) {
        console.log("Duplicate lead skipped:", leadId);
        continue;
      }

      processedLeadIds.add(leadId);

      try {
        const lead = await fetchLeadDetails(leadId);

        console.log(
          "Lead details received:",
          JSON.stringify(lead)
        );

        // Add the newest lead to the beginning
        recentLeads.unshift(lead);

        // Keep at most 20 leads
        if (recentLeads.length > MAX_RECENT_LEADS) {
          recentLeads.pop();
        }

        // Broadcast the new lead to connected clients
        const message = JSON.stringify({
          type: "new_lead",
          lead,
        });

        for (const client of wss.clients) {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(message);
            } catch (error) {
              console.error(
                "WebSocket send failed:",
                error.message
              );
            }
          }
        }
      } catch (error) {
        processedLeadIds.delete(leadId);
        console.error("Lead fetch failed:", error.message);
      }
    }
  }
}

// Start the HTTP server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on port ${PORT}`);
});

// WebSocket server shares the HTTP server and port
const wss = new WebSocketServer({
  server,
  path: "/ws",
});

wss.on("connection", (client) => {
  console.log("App connected");

  // Send recent leads immediately to a newly connected client
  client.send(
    JSON.stringify({
      type: "recent_leads",
      leads: recentLeads,
    })
  );

  client.on("close", (code, reason) => {
  console.log(
    "App disconnected. Code:",
    code,
    "Reason:",
    reason.toString()
  );
});

  client.on("error", (error) => {
    console.error("WebSocket error:", error.message);
  });
});
