const express = require('express')
const router = express.Router()
const Result = require('../models/Result')
const Feedback = require('../models/Feedback')
const Share = require('../models/Share')
const Analytics = require('../models/Analytics')

const { monthNames } = require('../utils/utils')

const collegesInfo = require('../collegeInfo.json')

router.get('/public', async (req, res) => {
  try {
    res.json(sendRes)
  } catch (err) {
    console.log(err)
    res.json(err)
  }
})


module.exports = router