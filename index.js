require('dotenv/config')
const express = require('express')
const axios = require('axios')
const morgan = require('morgan')
const mongoose = require('mongoose')

const Result = require('./models/Result')
const Feedback = require('./models/Feedback')
const Shared = require('./models/Shared')
const { getToken, convert2obj } = require('./utils/utils.js')
const { AllResultsRows } = require('./utils/resultRows')
const app = express()

const PORT = process.env.PORT || 3000
//allow cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, X-Auth-Token')
  next()
})
app.use(morgan('dev'))
app.use(express.json());

//get all results
app.get('/stats/:page', async (req, res) => {
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
    const sendRes = { count: results.count, colleges: searchCount, students :results.students}
    delete results
    // console.log(results)
    res.json(sendRes)
  } catch (err) {
    res.json(err)
  }
})
//get specific result
app.get('/:resultID/:htn', async (req, res) => {
  try {
    res.json(await getResult(req.params.resultID, req.params.htn))
  }
  catch (err) {
    res.status(404).json({ message: err })
  }
})
app.get('/semResults/:resultID/:prefix/:start/:end', async (req, res) => {
  res.json(await getSemResult(req.params.resultID,
    req.params.prefix,
    req.params.start,
    req.params.end))
  // res.json(req.body)
})
app.get('/releasedResults', async (req, res) => {
  res.json(await AllResultsRows())
})
app.post('/feedback', async (req, res) => {
  console.log(req.body)
  const feedback = new Feedback(req.body)
  feedback.save()
    .then(result => {
      console.log(result)
      res.status(200).send(result)
    })
})
app.post('/shared', async (req, res) => {
  console.log(req.body)
  const shared = new Shared(req.body)
  shared.save()
  res.status(200).send()
})
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
//         message: error.message
//       }
//     })
//   }
// })

mongoose.connect(process.env.DB_CONNECTION,
  { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
    if (err == null)
      console.log('Connceted to DB!')
    else
      console.error(err)
  })

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`)
})

let token = 0
//get token initially
getToken().then(res => token = res)

async function getSemResult(resultID, prefix, start, end) {
  return new Promise(async (resolve, reject) => {
    try {
      //check if result exist in db first 
      let resultList = []
      for (let i = start; i < end; i++) {
        try {
          resultList.push(await getResultFromDB(resultID, prefix +
            (i < 10 ? `0${i}` : i)))
          //console.log(resultList)
        } catch (err) {
          console.log(err)
        }
      }
      resolve(resultList)
    } catch (err) {
      reject(err)
    }
  })
}

async function getResult(resultID, htn) {
  return new Promise(async (resolve, reject) => {
    try {
      //check if result exist in db first 
      const result = await getResultFromDB(resultID, htn)
      resolve(result)
    } catch (err) {
      reject(err)
    }
  })
}

function getResultFromDB(resultID, htn) {
  //find in db with htn and resultID
  return new Promise((resolve, reject) => {
    Result.find({
      $and: [{ htn: htn }, { resultID: resultID }]
    }, async (err, result) => {
      if (err)
        return reject(err)
      if (result.length == 0) {
        try {
          const result = await getResultFromJNTU(resultID, htn)
          resolve(result)
        }
        catch (err) {
          console.log(err)
          return reject(err)
        }
      }
      else
        return resolve(result[0])
    })
  })
}

function getResultFromJNTU(resultID, htn) {
  return new Promise((resolve, reject) => {
    var config = {
      method: 'get',
      url: `https://jntuaresults.ac.in/results/res.php?ht=${htn}&id=${resultID}&accessToken=${token}`,
      headers: {
        'Cookie': 'PHPSESSID=kk98b6kd3oaft9p9p8uiis6ae6;',
      },
    };
    axios(config)
      .then(async (res) => {
        if (res.data == 'Something goes wrong') {
          console.log(res.data)
          token = await getToken()
          return reject('Token updated please reload')
        }
        //check if token is expired
        if (res.data == 'Invalid Token') {
          console.log('token expired')
          token = await getToken()
          return reject('Token updated please reload')
        }
        //reject if result not found
        if (res.data.includes('Invalid Hall Ticket Number')) {
          //removing <b> tag
          return reject(res.data.replace(/<\/?[^>]+(>|$)/g, ""))
        }
        let tableHTML = ''
        for (let i = 0; i < res.data.length; i++) {
          tableHTML += res.data[i]
        }
        //jntua is a fucking peice of shit for not adding these closing 
        //such a pain 
        tableHTML += '</th></tr></table>'
        const resultObj = convert2obj(tableHTML, resultID)

        const result = new Result(resultObj)
        result.save()
          .then(async (data) => {
            // console.log(data)
            resolve(await getResultFromDB(resultID, htn))
          })
          .catch(err => {
            console.log(err)
          })
        resolve(resultObj)
      })
      .catch(err => {
        console.log(err)
        reject('Result not found')
      })
  })

}
