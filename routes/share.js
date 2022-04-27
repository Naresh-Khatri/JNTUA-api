import Share from "../models/Share.js";

import express from "express";
const router = express.Router();
router.post("/",  async (req, res) => {
  console.log(req.body);
  const share = new Share(req.body);
  share.save();
  res.status(200).send();
});

export default router;
