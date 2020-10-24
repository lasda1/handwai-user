const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const passport = require("passport");
const mongoose = require("mongoose");
const config = require("./config/database");
var flash = require("connect-flash");

require("./config/passport")(passport);

// Connect To Database
mongoose.connect(config.database);
const app = express();

const users = require("./routes/users");
// CORS Middleware
app.use(cors());

app.use(cookieParser());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "twig");

// Set Static Folder
app.use(express.static(__dirname + "/public"));

//making uploads file publically available
app.use("/uploads", express.static("uploads"));

// Body Parser Middleware
app.use(bodyParser.json()).use(bodyParser.urlencoded({ extended: true }));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use("/users", users);

const port = 3000;
// Index Route
app.get("/", (req, res) => {
  res.send("Invalid Endpoint");
});

app.get("*", function (req, res) {
  res.render("404");
});

app.listen(process.env.PORT || port, () => {
  console.log("Server started on port " + port);
});
