const mongoose = require('mongoose');
const SearchSchema = mongoose.Schema({
    date: Date,
    time: Array,
    searchCount: {
        type: Number,
        default: 1
    },
})

module.exports = mongoose.model("Search", SearchSchema);