const axios = require('axios')
const HtmlTableToJson = require('html-table-to-json');

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
    subjects.forEach(sub => Object.assign(sub, { resultID: result.resultID }))
    // console.log(subjects)
    // const resultObj = {}
    // resultObj['htn'] = studInfo[0]
    // resultObj['name'] = ''
    // for (let i = 1; i < studInfo.length; i++) {
    //     resultObj['name'] += studInfo[i] + " "
    // }
    const sgpa = getSGPA(subjects)
    // Object.assign(resultObj, { result.resultID, failedCount, sgpa, subjects })

    const failedCount = getFailedCount(subjects)
    const attempt = {}
    Object.assign(attempt, { failedCount, sgpa, subjects, resultID: result.resultID })
    return attempt
}
function getAttempt(result, htn, token) {
    // console.log(arguments)
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
                // console.log('\n\nres', res.data)
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

async function getFullResultFromJNTU(resList, rollList, token) {
    return new Promise(async (resolve, reject) => {
        try {
            const resultsList = []
            rollList.map(roll => {
                resList.map(res => getAttempt(res, roll, token)
                    .then(res => resultsList.push(res))
                    .catch(err => console.log('cant pus res to resList',err))
                )
            })
            setTimeout(() => {
                console.log(resultsList)
            }, 2000)
            Promise.all(rollList.map(roll => { resList.map(res => getAttempt(res, roll, token)) }))
                .then(async res => {

                    // console.log('res', res)
                    //initialize with resInfo
                    const resObj = {}
                    resObj['attempts'] = res
                    return resObj;
                })
                // //this then is for below reason
                .then(async resObj => {
                    // console.log('init',resObj.htn, resObj.attempts[0].subjects[3])
                    // Object.assign(resObj, { roll })
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

examsList = [
    {
        title: 'B.Tech I Year I Semester (R19) Supplementary Examinations, March 2021',
        resultID: '56736497'
    },
    {
        title: 'B.Tech I Year I Semester (R19) Supplementary Examinations, October 2020',
        resultID: '56736380'
    },
    {
        title: 'B.Tech I Year I Semester (R19) Regular Examinations, January 2020',
        resultID: '56736322'
    }
]

const rollList = [
    '19fh1a0501',
    '19fh1a0502',
    '19fh1a0503',
]

getFullResultFromJNTU(examsList, rollList, '8163838').then(
    res =>
        console.log(res)
)