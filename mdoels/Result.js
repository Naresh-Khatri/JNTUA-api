const mongoose = require('mongoose')
const ResultSchema = mongoose.Schema({
    htn: String,
    name: String ,
    resultId:String,
    failedCount: Number,
    sgpa: Number,
    addedTime: Date,
    subjects: Array

})

module.exports = mongoose.model('Result', ResultSchema)