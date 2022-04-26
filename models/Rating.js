import mongoose  from 'mongoose'
const RatingSchema = mongoose.Schema({
    time: {
        default: Date
    },
    rating: Number,
    searchRoll: String,
    collegeCode: String,
})
export default mongoose.model('Rating', RatingSchema)