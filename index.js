require('dotenv/config')
const express = require('express')
const axios = require('axios')
const morgan = require('morgan')
const mongoose = require('mongoose')
const chalk = require('chalk')

const Result = require('./models/Result')
const Feedback = require('./models/Feedback')
const Share = require('./models/Share')
const Analytics = require('./models/Analytics')
const stats = require('./routes/stats')

const { getToken, convert2obj, getResultIDDetails,
  getFullResult, getFullBatchResults, addAnalytics } = require('./utils/utils.js')
const { updateReleasedResJSON, getReleasedResJSON } = require('./utils/releasedResManager')

const app = express()
const PORT = process.env.PORT || 3000

//allow cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, X-Auth-Token')
  next()
})
app.use(
  morgan(function (tokens, req, res) {
    var parenRegExp = /\(([^)]+)\)/;
    // let currTime = new Date(new Date(tokens.date(req, res, 'web')).getTime())
    let currTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
    let deviceInfo
    try {
      deviceInfo = parenRegExp.exec(tokens['user-agent'](req, res))[0]
    } catch (err) {
      deviceInfo = "dunno 🤔"
    }
    return [
      chalk.green('👉' + tokens.method(req, res)),
      chalk.bgGreen(tokens.status(req, res)),
      // chalk.bgBlueBright('⏳' + tokens.res(req, res, 'total-time'), '-'),
      chalk.bgBlueBright("⏰" + currTime.split(',')[1]),
      chalk.bgRedBright("📱" + deviceInfo),
      chalk.bgMagentaBright("🔗" + tokens.url(req, res)),
      chalk.bgBlueBright(tokens.referrer(req, res) ==
        'https://naresh-khatri.github.io/JNTUA-result-analyser-spa/' ?
        "🧾 " + "Homepage" : "🧾 " + tokens.referrer(req, res)),
      chalk.bgCyan("📦" + tokens.res(req, res, 'content-length')),
      "⚡ " +
      chalk.greenBright(tokens['response-time'](req, res), 'ms')
    ].join(' ')
  })
)
app.use(express.json());
app.use('/stats', stats)


//update releasedRes.json every 1 min
updateReleasedResJSON()
setInterval(() => {
  updateReleasedResJSON()
}, 60 * 1000)

//get token initially
getToken().then(res => {
  token = res
  console.log('token updated! -', token)
})
setInterval(async () => {
  token = await getToken()
}, 60 * 1000)

//get specific result
app.get('/singleResult/:resultID/:htn', async (req, res) => {
  try {
    res.json(await getResult(req.params.resultID, req.params.htn))
  }
  catch (err) {
    res.status(404).json({ message: err })
  }
})
// get all (regular + supply) res of htn
app.get('/singleResultv2/:htn/:reg/:course/:year/:sem', async (req, res) => {
  try {
    res.send(await getFullResult(Object.assign(req.params, { token: token })))
  }
  catch (err) {
    res.status(404).json({ message: err })
  }
})


app.get('/batchResult/:resultID/:prefix/:start/:end', async (req, res) => {
  res.json(await getBatchResult(req.params.resultID,
    req.params.prefix,
    req.params.start,
    req.params.end))
  // res.json(req.body)
})
app.get('/batchResultsv2/:rollPrefix/:start/:end/:reg/:course/:year/:sem', async (req, res) => {
  const results = await getFullBatchResults(Object.assign(req.params, { token: token }))
  // res.json(await getFullBatchResult(req.params.resultID,
  //   req.params.prefix,
  //   req.params.start,
  //   req.params.end))
  res.json(results)
})
app.get('/releasedResults', async (req, res) => {
  res.json(await getReleasedResJSON())
})
app.get('/resultIDDetails/:resID', async (req, res) => {
  res.json(await getResultIDDetails(req.params.resID))
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
app.post('/share', async (req, res) => {
  console.log(req.body)
  const share = new Share(req.body)
  share.save()
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



async function getBatchResult(resultID, prefix, start, end) {
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
async function getBatchResult(resultID, prefix, start, end) {
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
    addAnalytics(resultID, htn)
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
          // console.log(err)
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
        let tableHTML = res.data + '</th></tr></table>'
        //jntua is a fucking peice of shit for not adding these closings
        //such a pain 
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
