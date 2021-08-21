const mongoose = require('mongoose')

const FeedbackSchema = mongoose.Schema({
    email: String,
    name: String,
    text: String,
    addedTime:{
        type:Date,
        default:Date
    }
})

module.exports = mongoose.model('Feedback', FeedbackSchema)