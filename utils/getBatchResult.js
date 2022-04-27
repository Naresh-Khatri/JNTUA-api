// import axios from "axios";Zz
import fs from "fs";

// import FullResult from "../models/FullResult.js";
import rollsArr from "../utils/rolls.js";
// import getFullSGPA from "./SGPA.js";
// import getAttempt from "./getAttempts.js";
// import addAnalytics from "./addAnalytics.js";
import { getFullResultFromDB } from "./getResult.js";

export default function getFullBatchResults(params) {
  return new Promise((resolve, reject) => {
    fs.readFile("./utils/releasedRes.json", async (err, res) => {
      if (err) {
        throw err;
      }
      try {
        //getting result id
        const reg = params.reg.toUpperCase();
        const course = params.course.toUpperCase();
        const year = params.year.toUpperCase();
        const sem = params.sem.toUpperCase();
        const examsList = JSON.parse(res)[reg][course][year][sem];
        const resInfo = { reg, course, year, sem };

        // console.log(params.rollPrefix)
        if (examsList) {
          examsList.reverse();
          console.log(params);

          const rolls = [];
          const start = Number.parseInt(params.start);
          const end = Number.parseInt(params.end);

          for (let i = start; i <= end; i++) {
            let roll = params.rollPrefix + rollsArr[i];
            rolls.push(roll);
          }

          // console.log(rolls)
          const promises = rolls.map((roll) =>
            getFullResultFromDB(examsList, roll, resInfo)
          );
          // console.log(promises);
          Promise.all(promises)
            .then((res) => {
              // console.log("resa sdfasdf", res);
              //if a student was absent in every attempt, dont add to array
              const studentsResult = res.filter((stud) => {
                return Object.keys(stud).length;
              });
              // console.log("studentREstult", res);

              resolve(studentsResult);
            })
            .catch((err) => {
              console.log(err);
              reject(err);
            });

          // const resultsList = await Promise.all(promises)
          // for (let i = 0; i < promises.length; i++) {
          //     const res = await promises[i]
          //     // console.log(res)
          //     resultsList.push(res)
          // }
          // console.log('outside', resultsList)
          // resolve(resultsList)
        }
      } catch (err) {
        console.log(err);
        reject("sigh! 😔 no results");
      }
    });
  });
}
