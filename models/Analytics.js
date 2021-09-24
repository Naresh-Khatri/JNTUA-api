const mongoose = require('mongoose')
const AnalyticsSchema = mongoose.Schema({
    htn: String,
    resultID: String,
    latest: Date,
    count: Number,

})
module.exports = mongoose.model('Analytics', AnalyticsSchema)