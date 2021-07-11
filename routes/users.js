const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const validatePhoneNumber = require("validate-phone-number-node-js");

const router = express.Router();

const User = require("../models/User");

const { ensureAuthenticated } = require("../config/auth");

router.get("/login", (req, res) => {
  res.render("login");
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.get("/edit", ensureAuthenticated, (req, res) => {
  const id = req.query.id;
  User.findOne({ _id: id }, (err, user) => {
    if (err) throw err;
    res.render("edit", { user: user });
  });
});

router.post("/register", (req, res) => {
  const { firstName, lastName, email, mobileNo, address, password, password2 } =
    req.body;

  let errors = [];

  if (
    !firstName ||
    !lastName ||
    !email ||
    !mobileNo ||
    !address ||
    !password ||
    !password2
  ) {
    errors.push({ msg: "Please fill all fields" });
  }

  if (mobileNo.length != 10 || !validatePhoneNumber.validate(mobileNo)) {
    errors.push({ msg: "Invalid Mobile number" });
  }

  if (password != password2) {
    errors.push({ msg: "password donot match" });
  }

  if (errors.length > 0) {
    res.render("register", {
      errors,
      firstName,
      lastName,
      email,
      mobileNo,
      address,
      password,
      password2,
    });
  } else {
    User.findOne({ email: email }).then((user) => {
      if (user) {
        errors.push({ msg: "Email already exist" });
        res.render("register", {
          errors,
          firstName,
          lastName,
          email,
          mobileNo,
          address,
          password,
          password2,
        });
      } else {
        const newUser = new User({
          errors,
          firstName,
          lastName,
          email,
          mobileNo,
          address,
          password,
        });
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;

            newUser.password = hash;

            newUser
              .save()
              .then((user) => {
                req.flash(
                  "success_msg",
                  "you are now registered Please login!"
                );
                res.redirect("/users/login");
              })
              .catch((err) => console.log(err));
          });
        });
      }
    });
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true,
  })(req, res, next);
});

router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "you are successfully logged out");
  res.redirect("/users/login");
});

router.post("/edit", async (req, res) => {
  const { firstName, lastName, email, mobileNo, address } = req.body;
  const filter = { email: email };
  console.log(req.body);
  const update = {
    firstName: firstName,
    lastName: lastName,
    mobileNo: mobileNo,
    address: address,
  };
  await User.updateOne(filter, update, (err, result) => {
    if (err) throw err;
    res.redirect("/dashboard");
  });
});

module.exports = router;
