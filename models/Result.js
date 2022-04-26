import mongoose from "mongoose";
const ResultSchema = mongoose.Schema({
  htn: String,
  name: String,
  resultID: String,
  failedCount: Number,
  sgpa: Number,
  addedTime: {
    type: Date,
    default: Date,
  },
  subjects: Array,
});

export default mongoose.model("Result", ResultSchema);
