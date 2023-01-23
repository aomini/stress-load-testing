const mongoose = require("mongoose");

const MetricSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
    },
    /** Instance Users */
    ius: {
      type: Number,
    },
    /** Virtual Users */
    vus: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "IDLE",
    },
  },
  { timestamps: true }
);

const Metric = mongoose.model("Metric", MetricSchema);
module.exports = Metric;
