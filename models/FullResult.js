import mongoose from "mongoose";
const FullResultSchema = mongoose.Schema(
  {
    htn: String,
    name: String,
    sgpa: Number,
    reg: String,
    course: String,
    year: String,
    sem: String,
    collegeCode: String,
    attempts: Array,
    viewCount: {
      type: Number,
      default: 0,
    },
    lastViewed: Date,

    // resultID:String,
    // failedCount: Number,
    // subjects: Array,
    // addedTime: {
    //     type: Date,
    //     default: Date
    // },
  },
  { timestamps: true }
);

export default mongoose.model("FullResult", FullResultSchema);
