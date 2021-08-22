const mongoose = require('mongoose')
const sharedSchema = mongoose.Schema({
    resultID: String,
    htns: Array,
    type: String,
    addedTime: {
        type: Date,
        default: Date
    },

})

module.exports = mongoose.model('Shared', sharedSchema)