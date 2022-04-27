// import axios from "axios";Zz
import fs from "fs";

import FullResult from "../models/FullResult.js";
// import { getToken, convert2obj } from "../utils/utils.js";
import getFullSGPA from "./SGPA.js";
import getAttempt from "./getAttempts.js";
import addAnalytics from "./addAnalytics.js";

export default function getFullResult(params) {
  return new Promise((resolve, reject) => {
    fs.readFile("./utils/releasedRes.json", async (err, res) => {
      if (err) {
        throw err;
      }
      try {
        //capilatize everything! To search the JSON
        const reg = params.reg.toUpperCase();
        const course = params.course.toUpperCase();
        const year = params.year.toUpperCase();
        const sem = params.sem.toUpperCase();
        //regular + supply exams list
        const examsList = JSON.parse(res)[reg][course][year][sem];

        const resInfo = { reg, course, year, sem };
        if (examsList) {
          examsList.reverse();
          //checks all resultIDs
          //examsList is obj of resultID and label, resInfo to help identify each result in db
          const res = getFullResultFromDB(examsList, params.htn, resInfo);
          // res.attempts.map(attempt => console.log('attempt', attempt.subjects))
          resolve(res);
          // examsList.map(row => console.log(row.title))
        }
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  });
}

export async function getFullResultFromDB(examsList, htn, resInfo) {
  //   return new Promise((resolve, reject) => {
  try {
    const result = await FullResult.findOne({
      $and: [{ htn: htn }, { year: resInfo.year }, { sem: resInfo.sem }],
    });

    // console.log("fetching from db", result);
    //if db doesn't have the result get it from JNTUA
    // if (true) {
    if (!result) {
      try {
        // console.log("no result found in db");
        const resFromJNTU = await getFullResultFromJNTU(
          examsList,
          htn,
          resInfo
        );
        return resFromJNTU;
      } catch (err) {
        return err;
      }
    } else {
      try {
        //check if student failed
        // || result.attempts.include(null)
        if (result.sgpa <= 0) {
          // let oldViewCount = result[0].viewCount;
          // console.log(htn, 'failed, recalculating')
          // if failed then get all the attempts from JNTUA and update that in db
          const attemptsRes = await Promise.all(
            examsList.map((exam) => getAttempt(exam, htn))
          );
          const attempts = [];
          // let studAbsent = true;
          // console.log('attempts', attemptsRes)
          for (let i = 0; i < attemptsRes.length; i++) {
            if (!attemptsRes[i] || attemptsRes[i].length == 0) {
              continue;
            }
            attempts.push(attemptsRes[i].resultObj);
            // studAbsent = false;
          }
          // console.log("attemptsRes[i]", attempts)
          // console.log("resObj", resObj);
          const resObj = {};
          //initialize with resInfo
          resObj["attempts"] = attempts;
          //JNTUA fucking piece of shit!
          //res table is completely messed up sometimes
          //so calculated sgpa maybe NaN
          const sgpa = getFullSGPA(resObj["attempts"]);
          resObj["sgpa"] = !isNaN(sgpa) ? sgpa : 0;

          // console.log("resobj", resObj);
          FullResult.findOneAndUpdate(
            { htn: htn, year: resInfo.year, sem: resInfo.sem },
            resObj,
            { new: true, useFindAndModify: false },
            (err, res) => {
              if (err) console.log(err);
              else {
                // console.log(res)
                if (examsList) {
                  examsList.forEach((exam) => addAnalytics(exam.resultID, htn));
                }
                return res; //add anal iff examsList is not undefined
              }
            }
          );
        }
        // console.log("sldfsdf");

        // update viewCount and lastViewed
        FullResult.findOneAndUpdate(
          {
            $and: [{ htn: htn }, { year: resInfo.year }, { sem: resInfo.sem }],
          },
          {
            viewCount: result.viewCount + 1,
          },
          { useFindAndModify: false },
          (err) => {
            if (err) console.log(err);
            else {
              // console.log(docs)
            }
          }
        );
        // console.log('resssssssssssssss',result[0].viewCount)
        //add anal iff examsList is not undefined
        if (examsList) {
          examsList.forEach((exam) => addAnalytics(exam.resultID, htn));
        }
        // console.log(result);
        return result;
      } catch (err) {
        return err;
      }
    }
  } catch (err) {
    console.log("error getting res:", err);
    return err;
  }
}

async function getFullResultFromJNTU(examsList, htn, resInfo) {
  return new Promise((resolve, reject) => {
    try {
      // console.log("gonna search for", examsList);
      Promise.all(examsList.map((exam) => getAttempt(exam, htn)))
        .then((res) => {
          // console.log(res);
          // if(studentDropped(res)){
          //   return
          if (Object.keys(res[0]).length == 0) {
            return resolve({});
          }

          const attempts = [];
          let studName = "";
          let studAbsent = true;
          // res.map(attempt => console.log('attempt', attempt))

          for (let i = 0; i < res.length; i++) {
            if (res[i].resultObj == undefined) {
              attempts.push({});
              continue;
            }
            attempts.push(res[i].resultObj);
            studName = res[i].studName;
            studAbsent = false;
          }
          // attempts.map(attempt => console.log('attempt', attempt.subjects))
          // console.log('stud abs', studAbsent)
          console.log(attempts);

          const resObj = { ...resInfo };
          //initialize with resInfo
          // Object.assign(resObj, resInfo);
          resObj["attempts"] = attempts;
          if (studAbsent || resObj["attempts"] == undefined) {
            // console.log('stud absent')
            return resolve({});
          }
          resObj["name"] = studName;
          resObj["collegeCode"] = htn.slice(2, 4);
          resObj["htn"] = htn;
          // resObj.attempts.map(attempt => console.log('attempt', attempt.subjects))
          const sgpa = getFullSGPA(resObj["attempts"]);
          resObj["sgpa"] = sgpa;
          //   console.log('sgpa', sgpa)
          const fullResult = new FullResult(resObj);

          fullResult.save((err) => {
            if (err) {
              console.log("error saving", err);
              return reject(err);
            }
            return resolve(resObj);
          });

          //   console.log("resObj", resObj);
          // console.log('before',resObj.htn, resObj.attempts[0].subjects[3])
          return resolve(resObj);
        })
        .catch((err) => console.log(err));
    } catch (err) {
      console.log(err);
      return err;
    }
  });
}
