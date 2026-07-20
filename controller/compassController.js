/**
 * compassController.js
 *
 * Handles the Gemini 2.5 Flash API call for the Compass travel assistant.
 *
 * KEY CHANGE: Fetches listings directly from MongoDB (via the Listing model)
 * instead of trusting the frontend payload. This means Compass always has
 * access to your REAL, up-to-date listings — including Kolhapur and anything
 * else in the database — not a hardcoded sample array.
 *
 * - GEMINI_API_KEY lives only in .env, never reaches the frontend.
 * - Returns { reply, matchIds } where matchIds are real MongoDB _id strings.
 */

"use strict";

const Listing = require("../models/listing.js");

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

/**
 * Build the system instruction sent to Gemini.
 * Uses real MongoDB listing data so Gemini knows every actual listing.
 *
 * @param {Array} listings - Mongoose listing documents from MongoDB
 * @returns {string}
 */
function buildSystemInstruction(listings) {
  const listingsSummary = listings
    .map((l) => {
      const parts = [
        `id:${l._id}`,
        `"${l.title}"`,
        l.location ? `location: ${l.location}` : "",
        l.country  ? `country: ${l.country}`   : "",
        l.price    ? `₹${l.price}/night`        : "",
        l.description ? `desc: "${l.description.slice(0, 120)}"` : "",
      ].filter(Boolean);
      return parts.join(" | ");
    })
    .join("\n");

  return `You are Compass, a friendly AI travel assistant embedded inside a travel booking app called WanderLust.

AVAILABLE LISTINGS IN THE DATABASE (these are the ONLY listings that exist — recommend only from this list):
${listingsSummary}

YOUR JOB:
1. Read the full conversation history and the user's latest message carefully.
2. Match listings by location name, country, vibe, price range, description keywords, or any context clues.
3. Location matching must be FUZZY — "Kolhapur", "kolhapur", "near kolhapur" should all match a listing whose location or country contains "Kolhapur".
4. Respond with a warm, concise 1–3 sentence reply. Mention the listing name and location naturally.
5. Return ALL matching listing IDs (the exact id: values above) in matchIds.
6. If NO listings match, return matchIds as an empty array and suggest what the user could try instead.

FOLLOW-UP HANDLING:
- "cheaper ones" → filter previously mentioned results by lower price.
- "only beach" / "only mountain" → narrow by description or location keywords from prior results.
- Always use the full conversation history to resolve pronouns and references like "those", "the first one", etc.

STRICT OUTPUT FORMAT — return ONLY raw JSON with no extra text, no markdown, no code fences:
{"reply":"<your friendly reply>","matchIds":["<id1>","<id2>"]}

NEVER wrap in \`\`\`json\`\`\` or any delimiters. Raw JSON only.`;
}

/**
 * Map our { role, text } history into Gemini's
 * { role: "user"|"model", parts: [{ text }] } format.
 *
 * @param {Array}  conversationHistory - array of { role, text }
 * @param {string} latestUserMessage
 * @returns {Array}
 */
function buildGeminiContents(conversationHistory, latestUserMessage) {
  // Build history excluding the current message (added fresh below)
  const historyWithoutLatest = conversationHistory.filter(
    (turn) => turn.text !== latestUserMessage
  );

  const mapped = historyWithoutLatest.map((turn) => ({
    role: turn.role === "model" ? "model" : "user",
    parts: [{ text: turn.text }],
  }));

  // Append the fresh user turn
  mapped.push({ role: "user", parts: [{ text: latestUserMessage }] });

  return mapped;
}

/**
 * Strip markdown code fences Gemini sometimes adds despite instructions.
 * @param {string} raw
 * @returns {string}
 */
function stripMarkdownFences(raw) {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

/**
 * POST /api/compass/ask
 *
 * Body: { message: string, conversationHistory: Array }
 * (listings are fetched fresh from MongoDB — not trusted from the client)
 *
 * Response: { reply: string, matchIds: string[] }
 */
module.exports.askCompass = async (req, res) => {
  const { message, conversationHistory = [] } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    console.error("[Compass] GEMINI_API_KEY is not set.");
    return res.status(500).json({
      reply: "⚠️ Compass needs a Gemini API key. Add GEMINI_API_KEY to your .env file (get one free at https://aistudio.google.com/apikey) and restart the server.",
      matchIds: [],
    });
  }

  // ── Fetch REAL listings from MongoDB ──────────────────────────────────────
  let dbListings;
  try {
    // Select only the fields we need for the prompt + card rendering
    dbListings = await Listing.find({}).select(
      "_id title location country price description image"
    ).lean();
  } catch (dbErr) {
    console.error("[Compass] MongoDB fetch error:", dbErr);
    return res.status(500).json({
      reply: "Sorry, I couldn't load the listings right now. Please try again.",
      matchIds: [],
    });
  }

  if (!dbListings.length) {
    return res.json({
      reply: "There are no listings in the database yet. Add some listings first and I'll be ready to help!",
      matchIds: [],
    });
  }
  // ──────────────────────────────────────────────────────────────────────────

  const systemInstruction = buildSystemInstruction(dbListings);
  const contents = buildGeminiContents(conversationHistory, message.trim());

  const geminiPayload = {
    systemInstruction: { parts: [{ text: systemInstruction }] },
    contents,
    generationConfig: {
      maxOutputTokens: 600,
      temperature: 0.3, // Lower = more deterministic matching
    },
  };

  try {
    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("[Compass] Gemini API error:", geminiResponse.status, errText);

      if (geminiResponse.status === 400 && errText.includes("API_KEY_INVALID")) {
        return res.status(500).json({
          reply: "⚠️ The Gemini API key in your .env is invalid. Get a free key at https://aistudio.google.com/apikey and restart the server.",
          matchIds: [],
        });
      }

      return res.status(502).json({
        reply: "Sorry, I couldn't reach the AI service right now. Please try again.",
        matchIds: [],
      });
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      console.error("[Compass] Empty Gemini response:", JSON.stringify(geminiData));
      return res.json({
        reply: "I didn't get a response. Try rephrasing your query.",
        matchIds: [],
      });
    }

    const cleanedText = stripMarkdownFences(rawText);

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("[Compass] JSON parse failed. Raw:", rawText);
      return res.json({
        reply: rawText.length < 400 ? rawText : "Sorry, I couldn't understand that. Try rephrasing.",
        matchIds: [],
      });
    }

    const reply =
      typeof parsed.reply === "string" && parsed.reply.trim()
        ? parsed.reply.trim()
        : "Here are the stays I found for you!";

    // Validate that returned IDs actually exist in the DB (prevents hallucination)
    const dbIdSet = new Set(dbListings.map((l) => l._id.toString()));
    const matchIds = Array.isArray(parsed.matchIds)
      ? parsed.matchIds
          .filter((id) => typeof id === "string" && dbIdSet.has(id))
      : [];

    // Build full match objects so the frontend can show links on any page
    const matches = matchIds.map((id) => {
      const l = dbListings.find((d) => d._id.toString() === id);
      if (!l) return null;
      return {
        id:       l._id.toString(),
        title:    l.title    || "Untitled Listing",
        location: l.location || "",
        country:  l.country  || "",
        price:    l.price    || 0,
        href:     `/listings/${l._id}`,
      };
    }).filter(Boolean);

    return res.json({ reply, matchIds, matches });

  } catch (networkErr) {
    console.error("[Compass] Network error:", networkErr);
    return res.status(500).json({
      reply: "Sorry, I'm having trouble right now. Please try again.",
      matchIds: [],
    });
  }
};
