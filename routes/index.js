const express = require("express");

const router = express.Router();

const User = require("../models/User");

const { ensureAuthenticated } = require("../config/auth");

router.get("/", (req, res) => {
  res.redirect("/dashboard");
});

router.get(
  "/dashboard",
  ensureAuthenticated,
  paginatedResults(User),
  (req, res) => {
    let previous = "disabled";
    let next = "";
    if (res.paginatedResults.previous.page > 0) previous = "";
    if (res.paginatedResults.next.page == 0) next = "disabled";

    res.render("dashboard", {
      name: req.user.firstName,
      users: res.paginatedResults.results,
      token: res.paginatedResults.token,
      page: res.paginatedResults.page,
      previous: previous,
      next: next,
    });
  }
);

router.post("/search", ensureAuthenticated, (req, res) => {
  res.redirect("/dashboard?keyWord=" + req.body.search);
});

function paginatedResults(model) {
  return async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const keyWord = req.query.keyWord || "";
    const limit = 5;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = {};

    const pages = await model.countDocuments().exec();
    let token = pages / limit;
    if (token > parseInt(token)) token = parseInt(token) + 1;

    if (endIndex < (await model.countDocuments().exec())) {
      results.next = {
        page: page + 1,
        limit: limit,
      };
    } else {
      results.next = {
        page: 0,
        limit: limit,
      };
    }

    results.previous = {
      page: page - 1,
      limit: limit,
    };

    results.page = page;

    try {
      if (keyWord.length > 0) {
        token = 0;
        await model
          .find({ firstName: { $regex: keyWord, $options: "$i" } })
          .then((data) => {
            results.results = data;
          });
        if (results.results == 0) {
          await model
            .find({ lastName: { $regex: keyWord, $options: "$i" } })
            .then((data) => {
              results.results = data;
            });
        }
        if (results.results == 0) {
          await model
            .find({ email: { $regex: keyWord, $options: "$i" } })
            .then((data) => {
              results.results = data;
            });
        }
        if (results.results == 0) {
          await model
            .find({ mobileNo: { $regex: keyWord, $options: "$i" } })
            .then((data) => {
              results.results = data;
            });
        }
      } else
        results.results = await model
          .find()
          .limit(limit)
          .skip(startIndex)
          .exec();
      results.token = token;
      res.paginatedResults = results;

      next();
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  };
}

module.exports = router;
