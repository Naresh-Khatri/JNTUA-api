const mongoose = require('mongoose')
const shareSchema = mongoose.Schema({
    resultID: String,
    htns: Array,
    type: String,
    addedTime: {
        type: Date,
        default: Date
    },

})

module.exports = mongoose.model('Share', shareSchema)