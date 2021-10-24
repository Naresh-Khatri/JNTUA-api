const JSSoup = require('jssoup').default
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
        console.log(subject)
        //return sgpa as 0 if any subject has credit 0
        if ((subject.Credits == 0 && subject.Grades == "F")
            || subject.Grades == "AB") {
            flag = true
        }

        // this is yet another check to set flag true 
        // JNTU is a big pile of dog shit, they switched 
        // Credits column with Grades when student is detained
        if (subject.Grades == 0 && subject.Credits == "F") {
            flag = true
        }
        console.log(obtainedCred, totalCred)
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
        if ((sub.Credits == 0 && sub.Grades == "F")
            || sub.Grades == "AB") {
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
                    if (tr[i].find('a').attrs.href.includes(resultID)){
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
                        console.log(tr[i].find('a').nextElement._text, tr[i].find('a').attrs.href)
                        console.log(obj)
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
    getToken, parseInt, convert2obj, getSGPA, getFailedCount, getResultFromJNTU,
    getResultFromDB, getResultIDDetails, monthNames
}