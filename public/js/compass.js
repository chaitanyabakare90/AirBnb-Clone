/**
 * compass.js — Compass AI Travel Assistant (Frontend)
 *
 * This script runs globally on all pages (via boilerplate.ejs).
 * It manages:
 *   1. Opening and closing the Compass chat panel.
 *   2. Maintaining session-level chat history in sessionStorage across page loads.
 *   3. Redirecting the window to the main home page (/listings) with query parameters
 *      (?compass_ids=...&compass_query=...) to display search results exactly like
 *      the standard search bar.
 */

"use strict";

const conversationHistory = [];
const MAX_HISTORY_TURNS   = 10;

/** Saves chat history and panel state to sessionStorage before page redirects/reloads */
function saveSessionState() {
  try {
    sessionStorage.setItem("compass_history", JSON.stringify(conversationHistory));
    sessionStorage.setItem(
      "compass_panel_open",
      panel && panel.classList.contains("is-open") ? "true" : "false"
    );
  } catch (e) {
    console.error("[Compass] Failed to save session state:", e);
  }
}

/** Restores chat history and panel state from sessionStorage on page load */
function loadSessionState() {
  try {
    const savedHistory = sessionStorage.getItem("compass_history");
    const wasOpen      = sessionStorage.getItem("compass_panel_open");

    if (savedHistory) {
      const parsed = JSON.parse(savedHistory);
      // Clean duplicate welcome messages from log
      const welcomeMsg = document.querySelector("#compass-messages .compass-msg--ai");
      if (welcomeMsg && parsed.length > 0) {
        welcomeMsg.remove();
      }

      parsed.forEach((turn) => {
        if (turn.role === "user") {
          addUserMessage(turn.text);
        } else {
          addAssistantMessage(turn.text);
        }
        conversationHistory.push(turn);
      });
    }

    if (wasOpen === "true") {
      openPanel();
    }
  } catch (e) {
    console.error("[Compass] Failed to load session state:", e);
  }
}

/** Clears all stored conversation history */
function clearSessionState() {
  try {
    sessionStorage.removeItem("compass_history");
    sessionStorage.removeItem("compass_panel_open");
  } catch (e) {
    console.error("[Compass] Failed to clear session state:", e);
  }
}

/* ============================================================
   DOM REFERENCES
   ============================================================ */
let triggerBtn, panel, closeBtn, messagesArea, inputField, sendBtn;

/* ============================================================
   PANEL TOGGLE
   ============================================================ */
function openPanel() {
  if (!panel) return;
  panel.classList.add("is-open");
  if (triggerBtn) triggerBtn.style.display = "none";
  if (inputField) inputField.focus();
  sessionStorage.setItem("compass_panel_open", "true");
}
window.openPanel = openPanel;

function closePanel() {
  if (!panel) return;
  panel.classList.remove("is-open");
  if (triggerBtn) triggerBtn.style.display = "flex";
  sessionStorage.setItem("compass_panel_open", "false");
}

/* ============================================================
   CHAT MESSAGE HELPERS
   ============================================================ */
function addUserMessage(text) {
  if (!messagesArea) return;
  const el = document.createElement("div");
  el.className = "compass-msg compass-msg--user";
  el.textContent = text;
  messagesArea.appendChild(el);
  scrollToBottom();
  return el;
}

function addAssistantMessage(text) {
  if (!messagesArea) return;
  const el = document.createElement("div");
  el.className = "compass-msg compass-msg--ai";
  el.textContent = text;
  messagesArea.appendChild(el);
  scrollToBottom();
  return el;
}

function addThinkingMessage() {
  if (!messagesArea) return;
  const el = document.createElement("div");
  el.className = "compass-msg compass-msg--thinking";
  el.textContent = "Thinking…";
  messagesArea.appendChild(el);
  scrollToBottom();
  return el;
}

function scrollToBottom() {
  if (messagesArea) {
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }
}

/* ============================================================
   UI STATE HELPERS
   ============================================================ */
function setLoadingState(isLoading) {
  if (sendBtn) sendBtn.disabled = isLoading;
  if (inputField) inputField.disabled = isLoading;
  if (triggerBtn) triggerBtn.classList.toggle("is-loading", isLoading);
}

/* ============================================================
   SEND MESSAGE & REDIRECT
   ============================================================ */
async function handleSend() {
  const userText = inputField.value.trim();
  if (!userText) return;

  // Optimistically clear the input field
  inputField.value = "";
  addUserMessage(userText);
  conversationHistory.push({ role: "user", text: userText });

  setLoadingState(true);
  const thinkingEl = addThinkingMessage();

  const historySlice = conversationHistory.slice(-MAX_HISTORY_TURNS);

  try {
    const response = await fetch("/api/compass/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: userText,
        conversationHistory: historySlice,
      }),
    });

    if (!response.ok) throw new Error(`Server responded ${response.status}`);

    const data = await response.json();
    thinkingEl.remove();

    const reply    = data.reply    || "Here are the listings I found matching your description!";
    const matchIds = Array.isArray(data.matchIds) ? data.matchIds : [];

    // Append AI reply to widget log and state
    addAssistantMessage(reply);
    conversationHistory.push({ role: "model", text: reply });

    // Save session storage state
    saveSessionState();

    if (matchIds.length > 0) {
      // Redirect to the main listings home page to filter the cards exactly like the search bar
      const idsQuery   = matchIds.join(",");
      const urlEncoded = encodeURIComponent(userText);
      window.location.href = `/listings?compass_ids=${idsQuery}&compass_query=${urlEncoded}`;
    } else {
      // No matches found (just general chit-chat) — stay on the current page, re-enable UI
      setLoadingState(false);
      inputField.focus();
    }

  } catch (err) {
    console.error("[Compass] fetch error:", err);
    thinkingEl.remove();
    addAssistantMessage("Sorry, I'm having trouble connecting right now. Please try again.");
    setLoadingState(false);
  }
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  triggerBtn   = document.getElementById("compass-trigger");
  panel        = document.getElementById("compass-panel");
  closeBtn     = document.getElementById("compass-close-btn");
  messagesArea = document.getElementById("compass-messages");
  inputField   = document.getElementById("compass-input");
  sendBtn      = document.getElementById("compass-send-btn");

  if (!triggerBtn || !panel) return;

  // Bind click & key listeners
  triggerBtn.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  sendBtn.addEventListener("click", handleSend);
  inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // Restore chat history and panel state unconditionally on every load
  loadSessionState();
});
