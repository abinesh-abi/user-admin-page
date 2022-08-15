const router = require("express").Router();
const { ObjectId } = require("mongodb");
const app = require("../app.js");
const { connect } = require("../database/connection.js");
const bcrypt = require('bcrypt');

router.get("/", (req, res) => {
    res.setHeader("cache-control", "private,no-cache,no-store,must-revalidate");
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
    res.setHeader("cache-control", "private,no-cache,no-store,must-revalidate");
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

router.get("/create", (req, res) => {
      res.render("createUser", {
        name: '',
        emailErr: "",
        email: '',
      });
});

router.post("/create", (req, res) => {
  console.log('create user post page');
  let { body } = req;

  connect(async (db, client) => {
    let dbUser = await db.collection("user").findOne({ email: body.email });
    if (dbUser) {
      res.render("createUser", {
        name: body.name,
        emailErr: "this email is already in use",
        email: dbUser.email,
      });
    } else {
      let hashedPassword = bcrypt.hashSync(body.password,10)
      // console.log(hashedPassword);
      let{name,email}=body
      await db.collection("user").insertOne({name,email,password:hashedPassword});
      let dbname = await db.collection("user").findOne({email: body.email})
      // console.log(dbname);
      // req.session.user = dbname.name;
      res.redirect("/admin")
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
      .find({ email: { $regex: `^${req.params.id}` } })
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

router.get("/logout", (req, res) => {
  try {
    res.setHeader("cache-control", "private,no-cache,no-store,must-revalidate");
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
