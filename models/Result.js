const mongoose = require('mongoose')
const ResultSchema = mongoose.Schema({
    htn: String,
    name: String ,
    resultID:String,
    failedCount: Number,
    sgpa: Number,
    addedTime: {
        type: Date,
        default: Date
    },
    subjects: Array

})

module.exports = mongoose.model('Result', ResultSchema)