import "dotenv/config";
import express from "express";
import mongoose from "mongoose";

import stats from "./routes/stats.js";
import singleResultRoute from "./routes/singleResult.js";
import batchResultRoute from "./routes/batchResult.js";
import feedbackRoute from "./routes/feedback.js";
import rateRoute from "./routes/rate.js";
import shareRoute from "./routes/share.js";

import { getToken, getResultIDDetails } from "./utils/utils.js";

import logger from "./middlewares/logger.js";
import cors from './middlewares/allowCors.js'
import {
  updateReleasedResJSON,
  getReleasedResJSON,
} from "./utils/releasedResManager.js";

const app = express();
const PORT = process.env.PORT || 3000;

//allow cors
app.use(cors)
//custom logging morgan middleware goodness
app.use(logger);
app.use(express.json());

//update releasedRes.json every 1 min
updateReleasedResJSON();
setInterval(() => {
  updateReleasedResJSON();
}, 60 * 1000);

getToken();
//get token initially
getToken().then((token) => {
  console.log("💥token updated! -", token);
});
setInterval(async () => {
  getToken();
}, 60 * 1000);

app.use("/stats", stats);
//get specific result
app.use("/singleResult/v2", singleResultRoute);
app.use("/batchResults/v2", batchResultRoute);
app.use("/feedback", feedbackRoute);
app.use("/rate", rateRoute);
app.use("/share", shareRoute);
app.get("/releasedResults", async (req, res) => {
  res.json(await getReleasedResJSON());
});
app.get("/resultIDDetails/:resID", async (req, res) => {
  res.json(await getResultIDDetails(req.params.resID));
});

// app.use((req, res, next) => {
//   const err = new Error('Not Found!')
//   err.status = 404
//   next(err)
// })
// app.use((err, req, res) => {
//   {
//     res.status(err.status || 500)
//     res.json({
//       error: {
//         message: err.message
//       }
//     })
//   }
// })

mongoose.connect(
  process.env.DB_CONNECTION,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) => {
    if (err == null) console.log("Connceted to DB!");
    else console.error(err);
  }
);
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
