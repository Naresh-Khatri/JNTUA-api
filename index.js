require('dotenv/config')
const express = require('express')
const axios = require('axios')
const morgan = require('morgan')
const mongoose = require('mongoose')

const Result = require('./models/Result')
const { getToken, convert2obj } = require('./utils/utils.js')
const { AllResultsRows } = require('./utils/resultRows')
const app = express()

const PORT = process.env.PORT || 3000
app.use(morgan('dev'))

//allow cors
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    next()
})

//get all results
app.get('/', async (req, res) => {
    try {
        const results = await Result.find()
        res.json(results)
    } catch (err) {
        res.json(err)
    }
})
//get specific result
app.get('/:resultId/:htn', async (req, res) => {
    try {
        res.json(await getResult(req.params.resultId, req.params.htn))
    }
    catch (err) {
        res.status(404).json({ message: err })
    }
})
app.get('/resultRows', async (req, res) => {
    res.json(await AllResultsRows())
})
app.use((req, res, next) => {
    const err = new Error('Not Found!')
    err.status = 404
    next(err)
})
app.use((err, req, res) => {
    {
        res.status(err.status || 500)
        res.json({
            error: {
                message: error.message
            }
        })
    }
})

mongoose.connect(process.env.DB_CONNECTION,
    { useNewUrlParser: true, useUnifiedTopology: true }, (res) => {
        if (res == null)
            console.log('Connceted to DB!')
        else
            console.error(res)
    })

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})

let token = 0
//get token initially
getToken().then(res => token = res)

async function getResult(resultId, htn) {
    return new Promise(async (resolve, reject) => {
        try {
            //check if result exist in db first 
            const result = await getResultFromDB(resultId, htn)
            resolve(result)
        } catch (err) {
            reject(err)
        }
    })
}

function getResultFromDB(resultId, htn) {
    //find in db with htn and resultId
    return new Promise((resolve, reject) => {
        Result.find({
            $and: [{ htn: htn }, { resultId: resultId }]
        }, async (err, result) => {
            if (err)
                return reject(err)
            if (result.length == 0) {
                try {
                    const result = await getResultFromJNTU(resultId, htn)
                    resolve(result)
                }
                catch (err) {
                    return reject(err)
                }
            }
            else
                return resolve(result)
        })
    })
}

function getResultFromJNTU(resultId, htn) {
    return new Promise((resolve, reject) => {
        var config = {
            method: 'get',
            url: `https://jntuaresults.ac.in/results/res.php?ht=${htn}&id=${resultId}&accessToken=${token}`,
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
                const resultObj = convert2obj(tableHTML, resultId)

                const result = new Result(resultObj)
                // result.save()
                //     .then(data => {
                //         console.log(data)
                //     })
                //     .catch(err => {
                //         console.log(err)
                //     })
                resolve(resultObj)
            })
            .catch(err => {
                console.log(err)
                reject('Result not found')
            })
    })

}