import express from "express";
const router = express.Router();
import * as singleResultController from "../controllers/singleResultController.js";

//get specific result
router.get(
  "/:htn/:reg/:course/:year/:sem",
  singleResultController.getSingleResult
);

export default router
