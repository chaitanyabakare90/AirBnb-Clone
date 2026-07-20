/**
 * routes/compass.js
 *
 * Mounts the Compass AI endpoint at:
 *   POST /api/compass/ask
 *
 * Uses wrapAsync to pass any unhandled promise rejections
 * to the global Express error handler — consistent with the
 * rest of this project's routing pattern.
 */

"use strict";

const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const compassController = require("../controller/compassController.js");

// Parse JSON bodies for this API route
router.use(express.json());

router.post("/ask", wrapAsync(compassController.askCompass));

module.exports = router;
