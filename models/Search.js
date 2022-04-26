import mongoose from 'mongoose'
const SearchSchema = mongoose.Schema({
    date: Date,
    time: Array,
    searchCount: {
        type: Number,
        default: 1
    },
})

export default mongoose.model("Search", SearchSchema);