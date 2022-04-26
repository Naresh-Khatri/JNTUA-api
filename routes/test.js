import express from 'express'
const router = express.Router()
import Result  from '../models/Result.js'
import Feedback  from '../models/Feedback.js'
import Share  from '../models/Share.js'
import Analytics  from '../models/Analytics.js'

import { monthNames } from'../utils/utils.js'

import collegesInfo from '../collegeInfo.json'

router.get('/public', async (req, res) => {
  try {
    res.json(sendRes)
  } catch (err) {
    console.log(err)
    res.json(err)
  }
})


export default router