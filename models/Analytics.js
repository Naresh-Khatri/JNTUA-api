import mongoose  from 'mongoose'
const AnalyticsSchema = mongoose.Schema({
    htn: String,
    resultID: String,
    latest: Date,
    count: Number,
    collegeCode: String,
})
export default  mongoose.model('Analytics', AnalyticsSchema)