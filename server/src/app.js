const express = require("express");
const compression = require("compression");
const cors = require("cors");
var morgan = require("morgan");
const mongoose = require("mongoose");
const Metric = require("./MetricModel");

const app = express();

app.use(morgan("tiny"));
app.use(compression());
app.use(cors());
app.options("*", cors());
app.use(express.json());

app.get("/metrics", async (req, res, next) => {
  const { identifier } = req.query;
  try {
    const vus = [20, 50, 100, 150, 170, 200];
    let metrics = [];

    for (let i = 0; i < vus.length; i++) {
      const vuCount = vus[i];
      const lastVuCount = !i ? 0 : vus[i - 1] + 1;
      console.log(vuCount, lastVuCount);

      metrics.push({
        vu: vuCount,
        success: await Metric.count({
          identifier,
          status: "success",
          vus: vuCount,
          // ius: {
          //   $gte: lastVuCount,
          //   $lte: vuCount,
          // },
        }),
        failed: await Metric.count({
          identifier,
          status: "failure",
          vus: vuCount,

          // ius: {
          //   $gte: lastVuCount,
          //   $lte: vuCount,
          // },
        }),
        interupted: await Metric.count({
          identifier,
          status: "pending",
          vus: vuCount,

          // ius: {
          //   $gte: lastVuCount,
          //   $lte: vuCount,
          // },
        }),
      });
    }
    res.send({ data: metrics });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err.message || "Internal server error" });
  }
});

app.post("/metrics", async (req, res, next) => {
  try {
    const createdMetric = new Metric(req.body);
    await createdMetric.save();
    res.status(201).send({
      message: "Metric created successfully",
      data: createdMetric,
    });
  } catch (error) {
    res.status(500).send({ message: error.message || "Internal Server Error" });
  }
});

app.patch("/metrics/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const foundMetric = await Metric.findById(id);
    if (!foundMetric) {
      return res.status(404).send({ message: "Metric not found" });
    }
    const update = await Metric.findByIdAndUpdate(id, {
      status: req.body.status,
    });
    res.status(200).send({ message: "updated", data: update });
  } catch (error) {
    res.status(500).send({ message: error.message || "Internal Server Error" });
  }
});

app.get("/info/report", (req, res, next) => {
  console.log("here you are");
});

app.get("/", (req, res, next) => {
  res.send("Server is up and running");
});

let server;
mongoose
  .connect(
    `mongodb+srv://root:admin@cluster0.s2ohtux.mongodb.net/?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      // useFindAndModify: false,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Mongodb connected");
    server = app.listen(8000, () => {
      console.log("The report server is listening on port 8000");
    });
  });

const unexpectedErrorHandler = (error) => {
  console.error(error);
  if (server)
    server.close(() => {
      console.log("server closed");
      process.exit(1);
    });
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);

process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  if (server) {
    server.close();
  }
});
