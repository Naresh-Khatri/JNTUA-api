const axios = require('axios')
const HtmlTableToJson = require('html-table-to-json');

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
        //return sgpa as 0 if any subject has credit 0
        if ((subject.Credits == 0 && subject.Grades == "F")
            || subject.Grades == "AB") {
            console.log(subject)
            flag = true
        }
        obtainedCred += G2GP[subject.Grades] * subject.Credits
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
    subjects.forEach(sub => {
        if (sub.Credits == 0)
            count++
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
                let tableHTML = ''
                for (let i = 0; i < res.data.length; i++) {
                    tableHTML += res.data[i]
                }
                //jntua is a fucking peice of shit for not adding these closing 
                //such a pain 
                tableHTML += '</th></tr></table>'
                const resultObj = convert2obj(tableHTML, resultID)
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
module.exports = { getToken, parseInt, convert2obj, getSGPA, getFailedCount, getResultFromJNTU, getResultFromDB }