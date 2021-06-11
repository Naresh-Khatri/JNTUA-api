require('dotenv/config')
const express = require('express')
const axios = require('axios')
const morgan = require('morgan')
const mongoose = require('mongoose')
const HtmlTableToJson = require('html-table-to-json');

const Result = require('./mdoels/Result')

const app = express()

const PORT = process.env.PORT || 3000
app.use(morgan('dev'))

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    next()
})

app.get('/', async (req, res) => {
    try {
        const results = await Result.find()
        res.json(results)
    } catch (err) {
        res.json(err)
    }
})
app.get('/:resultId/:htn', async (req, res) => {
    try {
        res.json(await getResult(req.params.resultId, req.params.htn))
    }
    catch (err) {
        res.status(404).json({ message: err })
    }
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
    { useNewUrlParser: true, useUnifiedTopology: true }, () => {
        console.log('Connceted to DB!')
    })

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})

let token = 3275841

function getResult(resultId, htn) {
    return new Promise(async (resolve, reject) => {
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
                    return reject('Something goes wrong')
                }
                //check if token is expired
                if (res.data == 'Invalid Token') {
                    console.log('token expired')
                    token = await getToken()
                    return reject('Token updated please reload')
                }
                //reject if result not found
                if (res.data.includes('Invalid')) {
                    return reject('Result not found!')
                }
                let tableHTML = ''
                for (let i = 0; i < res.data.length; i++) {
                    tableHTML += res.data[i]
                }
                //jntua is a peice of shit for not adding these closing 
                //such a pain 
                tableHTML += '</th></tr></table>'
                const resultObj = convert2obj(tableHTML, resultId)
                const result = new Result(resultObj)
                result.save()
                    .then(data => {
                        console.log(data)
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

function getToken() {
    return new Promise((resolve, reject) => {
        var config = {
            method: 'get',
            url: 'https://jntuaresults.ac.in/view-results-56736424.html',
            headers: {
                'Cookie': 'PHPSESSID=kk98b6kd3oaft9p9p8uiis6ae6;',
            },
        };
        axios(config)
            .then((res) => {
                const pageHTML = res.data
                const token = parseInt(pageHTML.substring(
                    pageHTML.indexOf('access'), pageHTML.indexOf('access') + 30
                ))
                resolve(token)
            })
            .catch(err => reject(err))

    })
}
function parseInt(str) {
    let num = ''
    for (let i = 0; i < str.length; i++) {
        num += Number.parseInt(str[i]) || str[i] == '0' ?
            Number.parseInt(str[i]) : ''
    }
    return num
}
//returns a result object with all necessary info
function convert2obj(tableHTML, resultId) {
    const jsonTable = HtmlTableToJson.parse(tableHTML).results
    //remove <table> --> &nbsp; --> <tags> --> htn title --> name title -->split by ' '
    let studInfo = tableHTML.substring(0, tableHTML.indexOf('<br>'))
        .replace(/&nbsp;|<\/?[^>]+(>|$)|Hall Ticket No :|Student name:/g, '')
        .split(' ')

    const resultObj = {}
    resultObj['htn'] = studInfo[0]
    resultObj['name'] = ''
    for (let i = 1; i < studInfo.length; i++) {
        resultObj['name'] += studInfo[i] + " "
    }
    const subjects = jsonTable[0]
    const sgpa = getSGPA(subjects)
    const failedCount = getFailedCount(subjects)
    Object.assign(resultObj, { resultId, failedCount, sgpa, subjects })

    return resultObj
}

function getSGPA(subjects) {
    let G2GP = {
        S: 10,
        A: 9,
        B: 8,
        C: 7,
        D: 6,
        E: 5,
        F: 0,
        AB: 0
    }
    let totalCred = 0
    let obtainedCred = 0
    subjects.forEach(subject => {
        obtainedCred += G2GP[subject.Grades] * subject.Credits
        totalCred += Number.parseFloat(subject.Credits)
    })
    //check if totalCred is 0
    if (totalCred == 0)
        return 0
    else
        return (obtainedCred / totalCred).toFixed(2)
}
function getFailedCount(subjects) {
    let count = 0
    subjects.forEach(sub => {
        if (sub.Credits == 0)
            count++
    })
    return count
}