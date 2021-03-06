import express from "express";
const router = express.Router();
import Result from "../models/Result.js";
import Feedback from "../models/Feedback.js";
import Share from "../models/Share.js";
import Analytics from "../models/Analytics.js";
import Search from "../models/Search.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const collegesInfo = require('../utils/collegeInfo.json')

router.get("/totalSum", async (req, res) => {
  try {
    // const result = await Analytics.aggregate([{$group: { _id: null, sum: { $sum: "$count" } } }])
    const result = await Analytics.aggregate([
      {
        $group: {
          _id: { $substr: ["$htn", 2, 2] },
          sum: { $sum: "$count" },
        },
      },
      { $sort: { sum: -1 } },
    ]);
    // result.sort((a, b) => b.sum - a.sum)
    // console.log(result)
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

router.get("/public", async (req, res) => {
  try {
    // const results = {
    //   count: await Analytics.find().countDocuments(),
    //   students: await Analytics.find({}, '-_id htn addedTime').sort({ addedTime: 1 }).limit(req.params.page * 50),
    // }
    const result = await Analytics.aggregate([
      {
        $group: {
          _id: { $toLower: { $substrCP: ["$htn", 2, 2] } },
          total: { $sum: "$count" },
        },
      },
      { $sort: { total: -1 } },
    ]);
    const totalSearches = await Analytics.aggregate([
      { $group: { _id: null, sum: { $sum: "$count" } } },
    ]);
    const searchesArr = await Search.find({}, "-_id  date searchCount").sort({
      date: 1,
    });
    // console.log(searchesArr);
    // console.log(results.students)
    //create obj to store stats
    // const searchCount = {};
    // const searchDates = {};
    // for (let i = 0; i < results.students.length; i++) {
    //   let date = new Date(results.students[i].addedTime).getDate() + " " +
    //     monthNames[new Date(results.students[i].addedTime).getMonth()]

    //   if (!Object.keys(searchDates).includes(date))
    //     searchDates[date] = 1
    //   else
    //     searchDates[date]++

    //   //count searchCount for each college
    //   // const collegeCode = (results.students[i].htn[2] +
    //   //   results.students[i].htn[3]).toLowerCase()
    //   // if (!Object.keys(searchCount).includes(collegeCode))
    //   //   searchCount[collegeCode] = 1
    //   // else
    //   //   searchCount[collegeCode]++
    // }
    // let arr = Object.entries(searchCount)
    // arr.sort(([a, b], [c, d]) => d - b)
    console.log(result)
    const topColleges = [];
    for (let i = 0; i < 3; i++) {
      //loop through entire json to fine college name for code
      collegesInfo.forEach((college) => {
        if (college.collegeCode.toLowerCase() == result[i]["_id"].toLowerCase())
          topColleges.push(college);
      });
    }
    // const sendRes = {
    //    results.count, colleges: searchCount,
    //   topColleges, searchDates
    // }
    const sendRes = {
      searches: result,
      topColleges,
      totalSearches: totalSearches[0].sum,
      searchesArr,
    };
    // delete results
    // console.log(sendRes)
    res.json(sendRes);
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//get all results
router.get("/new/:page", async (req, res) => {
  try {
    const results = {
      count: await Result.find().countDocuments(),
      students: await Result.find({}, "-_id htn name addedTime")
        .sort({ addedTime: -1 })
        .limit(req.params.page * 50),
    };
    //create obj to store stats
    const searchCount = {};
    for (let i = 0; i < results.students.length; i++) {
      //count searchCount for each college
      if (
        !Object.keys(searchCount).includes(
          (
            results.students[i]._doc.htn[2] + results.students[i]._doc.htn[3]
          ).toLowerCase()
        )
      )
        searchCount[
          (
            results.students[i]._doc.htn[2] + results.students[i]._doc.htn[3]
          ).toLowerCase()
        ] = 1;
      else
        searchCount[
          (
            results.students[i]._doc.htn[2] + results.students[i]._doc.htn[3]
          ).toLowerCase()
        ]++;

      results.students[i]._doc["time"] = new Date(
        new Date(results.students[i].addedTime).getTime()
      ).toUTCString();
      delete results.students[i]._doc["addedTime"];
    }
    const sendRes = {
      count: results.count,
      colleges: searchCount,
      students: results.students,
    };
    // delete results
    // console.log(results)
    res.json(sendRes);
  } catch (err) {
    res.json(err);
  }
});
router.get("/all/:page/:sortByCount", async (req, res) => {
  try {
    const results = {
      rowsCount: await Analytics.find().countDocuments(),
      students:
        req.params.sortByCount == 1
          ? await Analytics.find({}, "-_id -__v")
              .sort({ count: -1 })
              .limit(req.params.page * 50)
          : await Analytics.find({}, "-_id -__v")
              .sort({ latest: -1 })
              .limit(req.params.page * 50),
    };
    //create obj to store stats
    const searchCount = {};
    for (let i = 0; i < results.students.length; i++) {
      //count searchCount for each college
      if (
        !Object.keys(searchCount).includes(
          (
            results.students[i]._doc.htn[2] + results.students[i]._doc.htn[3]
          ).toLowerCase()
        )
      )
        searchCount[
          (
            results.students[i]._doc.htn[2] + results.students[i]._doc.htn[3]
          ).toLowerCase()
        ] = 1;
      else
        searchCount[
          (
            results.students[i]._doc.htn[2] + results.students[i]._doc.htn[3]
          ).toLowerCase()
        ]++;

      //change time to match timezon
      results.students[i]._doc["time"] = new Date(
        new Date(results.students[i].latest).getTime()
      ).toUTCString();
      delete results.students[i]._doc["latest"];
    }
    //sum total count in all records
    let totalCount = 0;
    results.students.forEach((stud) => {
      totalCount += stud.count;
    });
    const sendRes = {
      totalCount: totalCount,
      rowsCount: results.rowsCount,
      colleges: searchCount,
      students: results.students,
    };
    // delete results
    // console.log(results)
    res.json(sendRes);
  } catch (err) {
    console.error(err);
    res.json(err);
  }
});

router.get("/feedbacks", async (req, res) => {
  try {
    const feedbacks = await Feedback.find({}, "-_id name email text addedTime");
    res.send(feedbacks);
  } catch (error) {
    console.log(error);
  }
});
router.get("/shares", async (req, res) => {
  try {
    const share = await Share.find({}, "-_id -__v");
    console.log(share);
    res.send(share);
  } catch (error) {
    console.log(error);
  }
});

export default router;
