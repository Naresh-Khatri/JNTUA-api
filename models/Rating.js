const mongoose = require('mongoose')
const RatingSchema = mongoose.Schema({
    time: {
        default: Date
    },
    rating: Number,
    searchRoll: String,
    collegeCode: String,
})
module.exports = mongoose.model('Rating', RatingSchema)