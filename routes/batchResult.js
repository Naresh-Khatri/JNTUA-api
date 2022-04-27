import express from "express";
const router = express.Router();
import * as batchResultController from "../controllers/batchResultController.js";

//get specific result
router.get(
  "/:rollPrefix/:start/:end/:reg/:course/:year/:sem",
  batchResultController.getBatchResult
);

export default router
