// import axios from 'axios'

import getFullBatchResult from "../utils/getBatchResult.js";

export async function getBatchResult(req, res) {
  try {
    const result =  await getFullBatchResult(req.params);
    res.json(result);
  } catch (err) {
    res.status(404).json({ message: err });
  }
}
