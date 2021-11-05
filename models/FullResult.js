const mongoose = require('mongoose')
const FullResultSchema = mongoose.Schema({
    htn: String,
    name: String,
    sgpa: Number,
    reg: String,
    course: String,
    year: String,
    sem: String,
    attempts: Array,
    viewCount: Number,
    lastViewed: {
        type: Date,
        default: Date
    },

    // resultID:String,
    // failedCount: Number,
    // subjects: Array,
    // addedTime: {
    //     type: Date,
    //     default: Date
    // },

})

module.exports = mongoose.model('FullResult', FullResultSchema)