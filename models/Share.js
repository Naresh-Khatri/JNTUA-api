import mongoose from  'mongoose'
const shareSchema = mongoose.Schema({
    resultID: String,
    htns: Array,
    type: String,
    addedTime: {
        type: Date,
        default: Date
    },

})

export default mongoose.model('Share', shareSchema)