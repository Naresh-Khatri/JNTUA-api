const mongoose = require('mongoose')
const ResultSchema = mongoose.Schema({
    htn: String,
    name: String ,
    resultId:String,
    failedCount: Number,
    sgpa: Number,
    addedTime: {
        type: Date,
        default: Date
    },
    subjects: Array

})

module.exports = mongoose.model('Result', ResultSchema)