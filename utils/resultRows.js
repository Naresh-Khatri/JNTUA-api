const JSSoup = require('jssoup').default
const { parseInt } = require('./utils')
const axios = require('axios')

let resultsObj = {}

const AllResultsRows = function () {
    return new Promise((resolve, reject) => {
        axios.get('https://jntuaresults.ac.in/index.php')
            .then(res => {
                const soup = new JSSoup(res.data)
                //get content of 2nd table
                //jntua is fucking insane for adding the first table for
                //no fucking reason, else would have used find() instead
                const table = soup.findAll('table')[1]
                const tr = table.findAll('tr')
                const resultRows = []
                resultsObj = {}
                for (let i = 1; i < 400; i++) {
                    resultRows.push(getResultInfoObj(tr[i].find('a').nextElement._text, tr[i].find('a').attrs.href))
                }
                resolve(resultsObj)
            })
            .catch(err => {
                console.log(err)
            }).finally(() => {
                // console.log(JSON.stringify(resultsObj, null, 2));
            })
    })

}
// returns filtered rows
const filteredResultsRows = function (data) {
    let resultsObj = {}
    return new Promise((resolve, reject) => {
        axios.get('https://jntuaresults.ac.in/index.php')
            .then(res => {
                const soup = new JSSoup(res.data)
                //get content of 2nd table
                //jntua is fucking insane for adding the first table for
                //no fucking reason, else would have used find() instead
                const table = soup.findAll('table')[1]
                const tr = table.findAll('tr')
                const resultRows = []
                resultsObj = {}
                for (let i = 1; i < 400; i++) {
                    resultRows.push(getResultInfoObj(tr[i].find('a').nextElement._text, tr[i].find('a').attrs.href))
                }
                resolve(resultsObj)
            })
            .catch(err => {
                console.log(err)
            }).finally(() => {
                // console.log(JSON.stringify(resultsObj, null, 2));
            })
    })

}
function getResultInfoObj(str, resultID) {
    const obj = {}
    var regulationRegExp = /\((R[^)]+)\)/;
    const splitString = str.toUpperCase().split(' ')

    title = obj['title'] = str
    reg = obj['reg'] = !!regulationRegExp.exec(str) ? regulationRegExp.exec(str)[1] : null
    year = obj['year'] = splitString[splitString.indexOf('YEAR') - 1] || null
    sem = obj['sem'] = splitString[splitString.indexOf('SEMESTER') - 1] == 'III' ? "I" :
        splitString[splitString.indexOf('SEMESTER') - 1] == 'IV' ? "II" :
            splitString[splitString.indexOf('SEMESTER') - 1] || null
    course = obj['course'] = splitString[0]
    resultID = obj['resultID'] = parseInt(resultID)
    // obj['type'] = splitString.includes('REGULAR') && splitString.includes('SUPPLEMENTARY')
    //     ? 'regular & suppy' : splitString.includes('REGULAR') ? 'regular' :
    //         splitString.includes('SUPPLEMENTARY') ? 'supply' : null
    //obj['heldOn'] = splitString[splitString.length - 2] + " " + splitString[splitString.length - 1]


    if (resultsObj[reg]) {
        if (resultsObj[reg][course]) {
            if (resultsObj[reg][course][year]) {
                if (resultsObj[reg][course][year][sem]) {
                    resultsObj[reg][course][year][sem].push({ title, resultID })
                } else {
                    resultsObj[reg][course][year][sem] = [{ title, resultID }]
                }
            } else {
                resultsObj[reg][course][year] = { [sem]: [{ title, resultID }] }
            }
        } else {
            resultsObj[reg][course] = { [year]: { [sem]: [{ title, resultID }] } }
        }
    } else {
        resultsObj[reg] = { [course]: { [year]: { [sem]: [{ title, resultID }] } } }
    }

    return obj
}

module.exports = { AllResultsRows }