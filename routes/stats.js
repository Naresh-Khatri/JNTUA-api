const express = require('express')
const router = express.Router()
const Result = require('../models/Result')
const Feedback = require('../models/Feedback')
const Share = require('../models/Share')
const Analytics = require('../models/Analytics')

//get all results
router.get('/new/:page', async (req, res) => {
  try {
    const results = {
      count: await Result.find().countDocuments(),
      students: await Result.find({}, '-_id htn name addedTime').sort({ addedTime: -1 }).limit(req.params.page * 50),
    }
    //create obj to store stats
    searchCount = {}
    for (let i = 0; i < results.students.length; i++) {
      //count searchCount for each college
      if (!Object.keys(searchCount).includes((results.students[i]._doc.htn[2] + results.students[i]._doc.htn[3]).toLowerCase()))
        searchCount[(results.students[i]._doc.htn[2] + results.students[i]._doc.htn[3]).toLowerCase()] = 1
      else
        searchCount[(results.students[i]._doc.htn[2] + results.students[i]._doc.htn[3]).toLowerCase()]++


      results.students[i]._doc['time'] =
        new Date(new Date(results.students[i].addedTime).getTime() + 330 * 60 * 1000).toUTCString()
      delete results.students[i]._doc['addedTime']
    }
    const sendRes = { count: results.count, colleges: searchCount, students: results.students }
    delete results
    // console.log(results)
    res.json(sendRes)
  } catch (err) {
    res.json(err)
  }
})
router.get('/all/:page/:sortByCount', async (req, res) => {
  try {
    const results = {
      rowsCount: await Analytics.find().countDocuments(),
      students: req.params.sortByCount ==1 ?
        await Analytics.find({}, '-_id -__v').sort({ count: -1 }).limit(req.params.page * 50):
        await Analytics.find({}, '-_id -__v').sort({ latest: -1 }).limit(req.params.page * 50)
    }
    //create obj to store stats
    searchCount = {}
    for (let i = 0; i < results.students.length; i++) {
      //count searchCount for each college
      if (!Object.keys(searchCount).includes((results.students[i]._doc.htn[2] + results.students[i]._doc.htn[3]).toLowerCase()))
        searchCount[(results.students[i]._doc.htn[2] + results.students[i]._doc.htn[3]).toLowerCase()] = 1
      else
        searchCount[(results.students[i]._doc.htn[2] + results.students[i]._doc.htn[3]).toLowerCase()]++

      //change time to match timezon
      results.students[i]._doc['time'] =
        new Date(new Date(results.students[i].latest).getTime() + 330
          * 60 * 1000).toUTCString()
      delete results.students[i]._doc['latest']
    }
    //sum total count in all records
    let totalCount = 0
    results.students.forEach(stud => {
      totalCount += stud.count
    });
    const sendRes = { totalCount: totalCount, rowsCount: results.rowsCount, colleges: searchCount, students: results.students }
    delete results
    // console.log(results)
    res.json(sendRes)
  } catch (err) {
    console.error(err)
    res.json(err)
  }
})

router.get('/feedbacks', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({}, '-_id name email text addedTime')
    res.send(feedbacks)
  } catch (error) {
    console.log(error)
  }
})
router.get('/shares', async (req, res) => {
  try {
    const share = await Share.find({}, "-_id -__v")
    console.log(share)
    res.send(share)
  } catch (error) {
    console.log(error)
  }
})

module.exports = router