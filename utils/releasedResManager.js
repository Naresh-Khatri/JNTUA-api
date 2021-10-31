const fs = require('fs')
const { AllResultsRows } = require('./resultRows')

async function updateReleasedResJSON() {
    fs.writeFile('./utils/releasedRes.json', JSON.stringify(await AllResultsRows()), () => {
        console.log('done')
    })
}
async function getReleasedResJSON() {
    return new Promise((resolve, reject) => {
        fs.readFile('./utils/releasedRes.json', (err, data) => {
            if (err) {
                reject({ message: 'unable to read from json' })
            }
            resolve(JSON.parse(data));
        })
    })
}
module.exports = { updateReleasedResJSON, getReleasedResJSON }