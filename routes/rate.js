import Rating from "../models/Rating.js";

import express from "express";
const router = express.Router();
router.post("/", async (req, res) => {
  console.log("new rating", req.body);
  const rating = new Rating(req.body);
  rating.save();
  res.status(200).send();
});

export default router;
