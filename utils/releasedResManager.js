import fs from "fs";
import getAllResultsRows from "./resultRows.js";

async function updateReleasedResJSON() {
  try {
    let rows = await getAllResultsRows();

    fs.writeFile("./utils/releasedRes.json", JSON.stringify(rows), () => {
      // console.log('JSON updated!')
    });
  } catch (err) {
    console.error("Cannot get from jntua 😢");
  }
}
async function getReleasedResJSON() {
  return new Promise((resolve, reject) => {
    fs.readFile("./utils/releasedRes.json", (err, data) => {
      if (err) {
        reject({ message: "unable to read from json" });
      }
      resolve(JSON.parse(data));
    });
  });
}
export { updateReleasedResJSON, getReleasedResJSON };
