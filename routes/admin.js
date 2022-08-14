const router = require("express").Router();
const { ObjectId } = require("mongodb");
const app = require("../app.js");
const { connect } = require("../database/connection.js");

router.get("/", (req, res) => {
  if (req.session.admin) {
  connect(async (db, client) => {
    let dbUsers = await db.collection("user").find().toArray();

    res.render("admin", {
      name: req.session.admin || "admin",
      dbUsers,
    });
    // client.close()
  });
  }else{
      res.redirect('/admin/login');
  }


});

router.get("/login", (req, res) => {
  res.render("adminlogin", {
    emailErr: "",
    passwordErr: "",
    email: "",
  });
});

router.post("/login", (req, res) => {
  res.setHeader("cache-control", "private,no-cache,no-store,must-revalidate");
  let { body } = req;

  connect(async (db, client) => {
    let dbAdmin = await db.collection("admin").findOne({ email: body.email });
    if (dbAdmin) {
      if (body.email === dbAdmin.email && body.password == dbAdmin.password) {
        req.session.admin = dbAdmin.name;
        res.redirect("/admin");
      } else if (body.password != dbAdmin.password) {
        console.log('invalied password');
        res.render("adminlogin", {
          emailErr: "",
          passwordErr: "invalied password",
          email: body.email,
        });
      }
    } else {
      res.render("adminlogin", {
        emaillErr: "Invalied mail",
        passwordErr: "",
        email: body.email,
      });
    }
    client.close();
  });
});

router.get("/delete/:id", (req, res) => {
  let mail = req.params.id;
  connect(async (db, client) => {
    console.log(req.params.id);
    let userDelete = await db
      .collection("user")
      .findOneAndDelete({ email: req.params.id });
    res.redirect("/admin");
  });
});

router.get("/edit/:id", (req, res) => {
  let id = req.params.id;
  connect(async (db, client) => {
    let user = await db.collection("user").findOne({ _id: ObjectId(id) });
    res.render("useredit", { emailErr: "", ...user });
  });
});

router.post("/edit/:id", (req, res) => {
  let { body } = req;
  let id = req.params.id;
  connect(async (db, client) => {
    let userExists = await db.collection("user").findOne({ _id:{$ne:ObjectId(id)},email:body.email });
    if (userExists) {
    res.render("useredit", { emailErr: "user aready exist", ...body,_id:id });
    }else {
      await db.collection("user").findOneAndUpdate({ _id: ObjectId(id) }, { $set: body });
      res.redirect("/admin");
    }

    client.close();
  });
});

router.get("/check", (req, res) => {
  connect(async (db, client) => {
    let data = await db.collection("user").find().toArray();
    res.json(data);
  });
});

router.get("/check/:id", (req, res) => {
  let email = req.params.id;
  console.log(email);
  connect(async (db, client) => {
    let data = await db
      .collection("user")
      .find({ email: { $regex: req.params.id } })
      // .find({ email:/^req.params.id/ })
      .toArray();

    console.log(data);
    console.log(data.length);

    if (data.length ===0) {
      res.json([]);
      
    } else {
      res.json(data);
    }
  });
});
module.exports = router;
