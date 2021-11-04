const fs = require('fs')
const JSSoup = require('jssoup').default
const axios = require('axios')
const HtmlTableToJson = require('html-table-to-json');
const Result = require('../models/Result')
const FullResult = require('../models/FullResult')
const Analytics = require('../models/Analytics')

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
function convert2obj(tableHTML, resultID) {
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
    Object.assign(resultObj, { resultID, failedCount, sgpa, subjects })

    return resultObj
}
function addAnalytics(resultID, htn) {
    Analytics.find({ resultID, htn }, async (err, result) => {
        if (err) {
            console.log(`Error: Couldnt add anal for ${htn} - ${resultID}`)
        }
        else {
            //result exist
            if (result.length) {
                Analytics.findOne({ htn, resultID })
                    .then((result, err) => {
                        //increase count, update time and save
                        result.count += 1
                        result.latest = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000).toUTCString()
                        result.save()
                    })
            }
            else {
                //add new entry with count=1, current time and save
                const anal = new Analytics({
                    htn,
                    resultID,
                    count: 1, latest: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000).toUTCString()
                })
                anal.save()
            }
        }
    })
}

function getSGPA(subjects) {
    let G2GP = {
        S: 10,
        O: 10,
        A: 9,
        B: 8,
        C: 7,
        D: 6,
        E: 5,
        F: 0,
        AB: 0,
        Y: 0
    }
    let totalCred = 0
    let obtainedCred = 0
    //flag to check if any subject's cred is 0
    let flag = false
    subjects.forEach(subject => {
        console.log(subject)
        //return sgpa as 0 if any subject has credit 0
        if ((subject.Credits == 0 && subject.Grade == "F")
            || subject.Grade == "AB") {
            flag = true
        }

        // this is yet another check to set flag true 
        // JNTU is a big pile of dog shit, they switched 
        // Credits column with Grade when student is detained
        if (subject.Grade == 0 && subject.Credits == "F") {
            flag = true
        }
        console.log(obtainedCred, totalCred)
        obtainedCred += G2GP[subject.Grade] * subject.Credits
        totalCred += Number.parseFloat(subject.Credits)
    })
    //check if totalCred is 0 ie AB or flag
    if (totalCred == 0)
        return 0
    else if (flag)
        return -1
    else
        return (obtainedCred / totalCred).toFixed(2)
}
function getFailedCount(subjects) {
    let count = 0
    if (!!!subjects) return 0
    subjects.forEach(sub => {
        if ((sub.Credits == 0 && sub.Grade == "F")
            || sub.Grade == "AB") {
            count++
        }
    })
    return count
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
                let tableHTML = res.data + '</th></tr></table>'
                //jntua is a fucking peice of shit for not adding these closing 
                //such a pain 
                const resultObj = convert2obj(tableHTML, resultID)
                resolve(resultObj)
            })
            .catch(err => {
                console.log(err)
                reject('Result not found')
            })
    })

}
function getResultFromDB(resultID, htn) {
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
                    return err
                }
            }
            else
                return resolve(result)
        })
    })
}


function getFullSGPA(attempts) {
    let G2GP = {
        S: 10,
        O: 10,
        A: 9,
        B: 8,
        C: 7,
        D: 6,
        E: 5,
        F: 0,
        AB: 0,
        Y: 0
    }
    //add first attempts to bestAttempts
    let bestAttempts = attempts[0].subjects
    //check if stud failed in first attempt
    if (attempts.length > 1) {
        for (let i = 1; i < attempts.length; i++) {
            //only check if stud attempted and this obj is not empty
            if (!!Object.keys(attempts[i]).length) {
                for (let j = 0; j < attempts[i].subjects.length; j++) {
                    //check if new res > old res using Grade (for now)
                    for (let k = 0; k < bestAttempts.length; k++) {
                        if (bestAttempts[k]['Subject Name'] == attempts[i].subjects[j]['Subject Name'])
                            if (G2GP[attempts[i].subjects[j].Grade] > G2GP[bestAttempts[k].Grade]) {
                                bestAttempts[k] = attempts[i].subjects[j]
                            }
                    }
                }
            }
        }
    }

    // console.log('actual len ', attempts[0].subjects.length, 'merged len = ', bestAttempts.length)

    let totalCred = 0
    let obtainedCred = 0
    let flag = false

    bestAttempts.forEach(subject => {
        // console.log(subject)
        //return sgpa as 0 if any subject has credit 0
        if ((subject.Credits == 0 && subject.Grade == "F")
            || subject.Grade == "AB") {
            flag = true
        }

        // this is yet another check to set flag true 
        // JNTU is a big pile of dog shit, they switched 
        // Credits column with Grade when student is detained
        if (subject.Grade == 0 && subject.Credits == "F") {
            flag = true
        }
        // console.log(obtainedCred, totalCred)
        obtainedCred += G2GP[subject.Grade] * subject.Credits
        totalCred += Number.parseFloat(subject.Credits)
    })
    //check if totalCred is 0 ie AB or flag
    if (totalCred == 0)
        return 0
    else if (flag)
        return -1
    else
        return (obtainedCred / totalCred).toFixed(2)
    // console.log('bestAttempts = ', bestAttempts)
}
//only returns the subject array, accepts resutlID to add it in attempts obj
function getAllAttemptsObj(tableHTML, result) {
    //when Grade is AB jntu calls it 'Grades' 😥
    tableHTML = tableHTML.replace(/Grades/g, 'Grade')
    const jsonTable = HtmlTableToJson.parse(tableHTML).results
    //remove <table> --> &nbsp; --> <tags> --> htn title --> name title -->split by ' '
    // let studInfo = tableHTML.substring(0, tableHTML.indexOf('<br>'))
    //     .replace(/&nbsp;|<\/?[^>]+(>|$)|Hall Ticket No :|Student name:/g, '')
    //     .split(' ')

    const subjects = jsonTable[0]
    //add resID examMonth to every elem
    const splitArr = result.title.split(' ')
    const monthArr = splitArr.slice(-2)
    monthArr[0] = monthArr[0].slice(0, 3)
    monthArr[1] = monthArr[1].slice(-2)
    month = monthArr.join('-')
    subjects.forEach(sub => Object.assign(sub, { resultID: result.resultID, month }))
    // console.log(subjects)
    // const resultObj = {}
    // resultObj['htn'] = studInfo[0]
    // resultObj['name'] = ''
    // for (let i = 1; i < studInfo.length; i++) {
    //     resultObj['name'] += studInfo[i] + " "
    // }
    // const sgpa = getSGPA(subjects)
    // Object.assign(resultObj, { result.resultID, failedCount, sgpa, subjects })

    const failedCount = getFailedCount(subjects)
    const attempt = {}
    Object.assign(attempt, { failedCount, subjects, resultID: result.resultID })
    return attempt
}
function getStudName(resultID, htn, token) {
    return new Promise(async (resolve, reject) => {
        var config = {
            method: 'get',
            url: `https://jntuaresults.ac.in/results/res.php?ht=${htn}&id=${resultID}&accessToken=${token}`,
            headers: {
                'Cookie': 'PHPSESSID=kk98b6kd3oaft9p9p8uiis6ae6;',
            },
        };
        try {
            const res = await axios(config)
            let studInfo = res.data.substring(0, res.data.indexOf('<br>'))
                .replace(/&nbsp;|<\/?[^>]+(>|$)|Hall Ticket No :|Student name:/g, '')
                .split(' ')
            studInfo.shift()
            resolve(studInfo.join(' '))
        }
        catch (err) {
            reject('some error 😢')
        }
    })
}
function getAttempt(result, htn, token) {
    return new Promise(async (resolve, reject) => {
        var config = {
            method: 'get',
            url: `https://jntuaresults.ac.in/results/res.php?ht=${htn}&id=${result.resultID}&accessToken=${token}`,
            headers: {
                'Cookie': 'PHPSESSID=kk98b6kd3oaft9p9p8uiis6ae6;',
            },
        };
        axios(config)
            .then(async (res) => {
                if (res.data == 'Something goes wrong 😟') {
                    console.log(res.data)
                    reject('Something goes wrong 😟')
                    return
                }
                //check if token is expired
                if (res.data == 'Invalid Token') {
                    console.log('token expired')
                    reject('Token updated please reload')
                    return
                }
                //reject if result not found
                if (res.data.includes('Invalid')) {
                    console.log(`Invalid htn=${htn} with resid=${result.resultID}`)
                    return resolve({})
                }
                let tableHTML = res.data + '</th></tr></table>'
                //jntua is a fucking piece of shit for not adding these closing tags
                //such a pain 
                const resultObj = getAllAttemptsObj(tableHTML, result)
                // console.log(resultObj)
                resolve(resultObj)
            })
            .catch(err => {
                console.log(err)
            })
    })
}
async function getFullResultFromJNTU(examsList, htn, token, resInfo) {
    return new Promise(async (resolve, reject) => {
        try {
            Promise.all(examsList.map(exam => getAttempt(exam, htn, token)))
                .then(async res => {

                    // console.log('res', res)
                    //initialize with resInfo
                    resObj = resInfo
                    resObj['viewCount'] = 1
                    resObj['attempts'] = res
                    return resObj;
                })
                //this then is for below reason
                .then(async resObj => {
                    // console.log('init',resObj.htn, resObj.attempts[0].subjects[3])

                    //getStudName returns a promise so we need to wait for it
                    const studName = await getStudName(examsList[0].resultID, htn, token)
                    Object.assign(resObj, { name: studName })
                    const sgpa = getFullSGPA(resObj['attempts'])
                    Object.assign(resObj, { htn, sgpa })
                    // console.log('res', resObj.attempts[0].subjects[3])
                    const fullResult = new FullResult(resObj)
                    fullResult.save((err, res) => {
                        if (err)
                            console.log(err)
                        else {
                            console.log(res)
                            return resObj
                        }
                    })
                    // console.log('resObj', resObj)
                    // console.log('before',resObj.htn, resObj.attempts[0].subjects[3])

                    resolve(resObj)
                })
                .catch(err => {
                    console.log(err)
                    reject(err)
                })
        }
        catch (err) {
            console.log(err)
            reject(err)
        }
    })
}
function getFullResultFromDB(examsList, htn, token, resInfo) {
    // return getFullResultFromJNTU(examsList, htn, token, resInfo)
    return new Promise(async (resolve, reject) => {
        //add anal
        if (!!examsList) {
            examsList.forEach(row=> addAnalytics(row.resultID, htn))
        }
        FullResult.find({
            $and: [{ htn: htn }, { year: resInfo.year }, { sem: resInfo.sem }]
        }, async (err, result) => {
            // console.log('result', result)
            //error
            if (err)
                return reject(err)
            //res doesnt exist
            if (result.length == 0) {
                try {
                    // const result = await getResultFromJNTU(resultID, htn)
                    const res = await getFullResultFromJNTU(examsList, htn, token, resInfo)
                    // console.log('after',res.htn, res.attempts[0].subjects[3])

                    resolve(res)
                }
                catch (err) {
                    return err
                }
            }
            //fetched from db
            else {
                FullResult.findOneAndUpdate({
                    $and: [{ htn: htn }, { year: resInfo.year }, { sem: resInfo.sem }]
                }, { viewCount: result[0].viewCount + 1 }, { useFindAndModify: false }, (err, docs) => {
                    if (err)
                        console.log(err)
                    else {
                        console.log(docs)
                    }
                })
                // console.log('resssssssssssssss',result[0].viewCount)
                return resolve(result[0])
            }
        })
    })
}

//gets all results of stud of a sem
function getFullResult(data) {
    return new Promise((resolve, reject) => {

        fs.readFile('./utils/releasedRes.json', async (err, res) => {
            if (err) {
                throw err;
            }
            try {
                //capilatize everything!
                const reg = data.reg.toUpperCase()
                const course = data.course.toUpperCase()
                const year = data.year.toUpperCase()
                const sem = data.sem.toUpperCase()
                // console.log(reg, course, year, sem)
                const examsList = JSON.parse(res)[reg][course][year][sem]

                resInfo = { reg, course, year, sem }
                if (examsList) {
                    examsList.reverse()
                    //checks all resultIDs 
                    //examsList is obj of resultID and label, resInfo to help identify each result in db
                    const res = await getFullResultFromDB(examsList, data.htn, data.token, resInfo)
                    // console.log(res)
                    resolve(res)
                    // examsList.map(row => console.log(row.title))
                }
            }
            catch (err) {
                console.log(err)
                reject('sigh! 😔 no results')
            }
        })
    });
}

function getFullBatchResults(data) {
    return new Promise((resolve, reject) => {
        fs.readFile('./utils/releasedRes.json', async (err, res) => {
            if (err) {
                throw err;
            }
            try {
                const reg = data.reg.toUpperCase()
                const course = data.course.toUpperCase()
                const year = data.year.toUpperCase()
                const sem = data.sem.toUpperCase()
                const examsList = JSON.parse(res)[reg][course][year][sem]
                const resInfo = { reg, course, year, sem }
                // console.log(examsList)
                if (examsList) {
                    examsList.reverse()
                    const range = []
                    for (let i = data.start; i <= data.end; i++)
                        range.push(i < 10 ? `0${i}` : i)

                    const promises = range.map((rollSuffix) =>
                        getFullResultFromDB(examsList, data.rollPrefix + rollSuffix,
                            data.token, resInfo))
                    const resultsList = []

                    console.log(await promises[0])
                    console.log(await promises[1])
                    console.log(await promises[2])

                    // const resultsList = await Promise.all(promises)
                    // for (let i = 0; i < promises.length; i++) {
                    //     const res = await promises[i]
                    //     // console.log(res)
                    //     resultsList.push(res)
                    // }
                    // console.log('outside', resultsList)
                    resolve(resultsList)
                }
            }
            catch (err) {
                console.log(err)
                reject('sigh! 😔 no results')
            }
        })
    })

}

function getResultIDDetails(resultID) {
    return new Promise((resolve, reject) => {
        axios.get('https://jntuaresults.ac.in/index.php')
            .then(res => {
                const soup = new JSSoup(res.data)
                //get content of 2nd table
                //jntua is fucking insane for adding the first table for
                //no fucking reason, else would have used find() instead
                const table = soup.findAll('table')[1]
                const tr = table.findAll('tr')
                const obj = {}
                for (let i = 1; i < 400; i++) {
                    if (tr[i].find('a').attrs.href.includes(resultID)) {
                        const str = tr[i].find('a').nextElement._text
                        var regulationRegExp = /\((R[^)]+)\)/;
                        const splitString = str.toUpperCase().split(' ')

                        obj['title'] = str
                        obj['reg'] = !!regulationRegExp.exec(str) ? regulationRegExp.exec(str)[1] : null
                        obj['year'] = splitString[splitString.indexOf('YEAR') - 1] || null
                        obj['sem'] = splitString[splitString.indexOf('SEMESTER') - 1] == 'III' ? "I" :
                            splitString[splitString.indexOf('SEMESTER') - 1] == 'IV' ? "II" :
                                splitString[splitString.indexOf('SEMESTER') - 1] || null
                        obj['course'] = splitString[0]
                        obj['resultID'] = parseInt(resultID)
                        // console.log(tr[i].find('a').nextElement._text, tr[i].find('a').attrs.href)
                        // console.log(obj)
                    }
                    // resultRows.push(getResultInfoObj(tr[i].find('a').nextElement._text, tr[i].find('a').attrs.href))
                }
                resolve(obj)
            })
            .catch(err => {
                console.log(err)
            }).finally(() => {
                // console.log(JSON.stringify(resultsObj, null, 2));
            })
    })
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

module.exports = {
    getToken, parseInt, addAnalytics, convert2obj, getSGPA, getFailedCount, getResultFromJNTU,
    getResultFromDB, getFullResult, getFullBatchResults, getResultIDDetails, monthNames
}