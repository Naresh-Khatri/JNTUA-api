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