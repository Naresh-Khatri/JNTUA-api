import mongoose from 'mongoose'

const FeedbackSchema = mongoose.Schema({
    email: String,
    name: String,
    text: String,
    addedTime:{
        type:Date,
        default:Date
    }
})

export default  mongoose.model('Feedback', FeedbackSchema)