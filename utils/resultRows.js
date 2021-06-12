const JSSoup = require('jssoup').default
const { parseInt } = require('./utils')
const axios = require('axios')

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
                for (let i = 1; i < tr.length; i++) {
                    resultRows.push(getResultInfo(tr[i].find('a').nextElement._text, tr[i].find('a').attrs.href))
                }
                console.log(resultRows)
                resolve(resultRows)
            })
            .catch(err => {
                console.log(err)
            })
    })

    function getResultInfo(str, resultId) {
        const obj = {}
        var regulationRegExp = /\((R[^)]+)\)/;
        const splitString = str.toUpperCase().split(' ')

        obj['title'] = str
        obj['regulation'] = !!regulationRegExp.exec(str) ? regulationRegExp.exec(str)[1] : null
        obj['year'] = splitString[splitString.indexOf('YEAR') - 1] || null
        obj['semester'] = splitString[splitString.indexOf('SEMESTER') - 1] || null
        obj['resultType'] = splitString.includes('REGULAR') ? 'regular' :
            splitString.includes('SUPPLEMENTARY') ? 'supply' : null
        obj['month'] = splitString[splitString.length - 2] + " " + splitString[splitString.length - 1]
        obj['courseName'] = splitString[0]
        obj['resultId'] = parseInt(resultId)

        return obj
    }
}

module.exports = { AllResultsRows }