// import axios from 'axios'

import getFullResult from "../utils/getResult.js";

export async function getSingleResult(req, res) {
  try {
    const result = await getFullResult(req.params);
    res.json(result);
  } catch (err) {
    res.status(404).json({ message: err });
  }
}
