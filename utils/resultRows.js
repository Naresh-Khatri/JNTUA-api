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
                    resultRows.push(getResultInfoObj(tr[i].find('a').nextElement._text, tr[i].find('a').attrs.href))
                }
                resolve(resultRows)
            })
            .catch(err => {
                console.log(err)
            })
    })

    function getResultInfoObj(str, resultID) {
        const obj = {}
        var regulationRegExp = /\((R[^)]+)\)/;
        const splitString = str.toUpperCase().split(' ')

        obj['title'] = str
        obj['reg'] = !!regulationRegExp.exec(str) ? regulationRegExp.exec(str)[1] : null
        obj['year'] = splitString[splitString.indexOf('YEAR') - 1] || null
        obj['sem'] = splitString[splitString.indexOf('SEMESTER') - 1] == 'III' ? "I" :
            splitString[splitString.indexOf('SEMESTER') - 1] == 'IV' ? "II" :
                splitString[splitString.indexOf('SEMESTER') - 1] || null
        obj['type'] = splitString.includes('REGULAR') && splitString.includes('SUPPLEMENTARY')
            ? 'regular & suppy' : splitString.includes('REGULAR') ? 'regular' :
                splitString.includes('SUPPLEMENTARY') ? 'supply' : null
        obj['heldOn'] = splitString[splitString.length - 2] + " " + splitString[splitString.length - 1]
        obj['course'] = splitString[0]
        obj['resultID'] = parseInt(resultID)

        return obj
    }
}

module.exports = { AllResultsRows }