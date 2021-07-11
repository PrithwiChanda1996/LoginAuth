const express = require("express");
const expressLayout = require("express-ejs-layouts");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const os = require("os");

const app = express();

require("./config/passport")(passport);

//Mongodb Setup
const db = require("./config/keys").MongoURI;

mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Mongo Db connected"))
  .catch((err) => console.log(err));

//EJS setup
app.use(expressLayout);
app.set("view engine", "ejs");

//Body-Parser innitialization
app.use(express.urlencoded({ extended: false }));

//Session setup
app.use(
  session({
    secret: "my secret",
    resave: true,
    saveUninitialized: true,
  })
);

//Passport innitialization
app.use(passport.initialize());
app.use(passport.session());

//Connecting the flash
app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

//Redirecting routes
app.use("/", require("./routes/index"));
app.use("/users", require("./routes/users"));

//Configuring os for network Interface .
const ifaces = os.networkInterfaces();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  genURL();
});

// @ Function to generate local machine URL
const genURL = () => {
  Object.keys(ifaces).forEach((ifname) => {
    var alias = 0;
    ifaces[ifname].forEach((iface) => {
      if ("IPv4" !== iface.family || iface.internal !== false) {
        return;
      }
      if (alias >= 1) {
      } else {
        var url = "http://" + iface.address + ":" + PORT + "/";
        console.log(url);
      }
      ++alias;
    });
  });
};
