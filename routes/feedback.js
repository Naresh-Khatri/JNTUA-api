import Feedback from "../models/Feedback.js";

import express from "express";
const router = express.Router();
router.post("/", async (req, res) => {
  console.log(req.body);
  const feedback = new Feedback(req.body);
  feedback.save().then((result) => {
    console.log(result);
    res.status(200).send(result);
  });
});

export default router;
