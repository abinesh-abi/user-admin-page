const { json } = require("express");
var express = require("express");
var router = express.Router();
const { connect } = require("../database/connection.js");

// GET home page.
router.get("/", function (req, res, next) {
  res.setHeader("cache-control", "private,no-cache,no-store,must-revalidate");
  if (req.session.user) {
    res.render("index", { name: req.session.user });
  } else {
    res.redirect("/login");
  }
});

//signup user
router.get("/signup", (req, res) => {
  res.setHeader("cache-control", "private,no-cache,no-store,must-revalidate");
      res.render("signup", {
        name: '',
        emailErr: "",
        email: '',
      });
});

router.post("/signup", (req, res) => {
  res.setHeader("cache-control", "private,no-cache,no-store,must-revalidate");
  let { body } = req;

  connect(async (db, client) => {
    let dbUser = await db.collection("user").findOne({ email: body.email });
    if (dbUser) {
      res.render("signup", {
        name: body.name,
        emailErr: "you already have account",
        email: dbUser.email,
      });
    } else {
      console.log(body);
      await db.collection("user").insertOne(body);
      let dbname = await db.collection("user").findOne({email: body.email})
      req.session.user = dbname.name;
      res.render("index", { name: req.session.user });
    }
    client.close();
  });
});

//login user
router.get("/login", (req, res) => {
  res.setHeader("cache-control", "private,no-cache,no-store,must-revalidate");
  res.render("login", { emaillErr: "", passwordErr: "", email: "" });
});

router.post("/login", (req, res) => {
  res.setHeader("cache-control", "private,no-cache,no-store,must-revalidate");
  let { body } = req;

  connect(async (db, client) => {
    let dbUser = await db.collection("user").findOne({ email: body.email });
    if (dbUser) {
      if (body.email === dbUser.email && body.password == dbUser.password) {
        req.session.user = dbUser.name;
        res.redirect("/");
      }  else if (body.password != dbUser.password) {
        res.render("login", {
          emaillErr: "",
          passwordErr: "invalied password",
          email: body.email,
        });
      }
    }else{
        res.render("login", {
          emaillErr: "Invalied mail",
          passwordErr: "",
          email: body.email,
        });
      }
    client.close();
  });
});

router.post("/logout", (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
