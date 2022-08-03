require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const dns = require("dns");

const mongoose = require("mongoose");
const { urlencoded } = require("express");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const Url = mongoose.model("Url", urlSchema);

// Your first API endpoint
app.post("/api/shorturl", (req, res) => {
  const nUrl = new URL(req.body.url);
  dns.lookup(nUrl.hostname, (error) => {
    if (error && error.code === "ENOTFOUND") {
      res.json({ error: "invalid url" });
    } else {
      Url.findOne({ original_url: req.body.url }, (err, data) => {
        if (err) return console.error("3 ", err);
        if (data == null) {
          Url.countDocuments({}, (err, count) => {
            if (err) {
              console.log(err);
            } else {
              new Url({
                original_url: req.body.url,
                short_url: count + 1,
              }).save(function (err, data) {
                console.log(data);
                if (err) return console.error("3 ", err);
                res.json({
                  original_url: data.original_url,
                  short_url: data.short_url,
                });
              });
            }
          });
        } else {
          res.json({
            original_url: data.original_url,
            short_url: data.short_url,
          });
        }
      });
    }
  });
});

app.get("/api/shorturl/:num", function (req, res) {
  Url.findOne({ short_url: req.params.num }, (err, data) => {
    if (err) return console.error("3 ", err);
    res.redirect(data.original_url);
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
