const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const config = require("../config/database");
const User = require("../models/user");

/* GET users listing. */
router.get("/admin/users", adminLoginRequired, function (req, res, next) {
  User.find({}, function (err, users) {
    let authUser = req.user;
    res.render("list_users", {
      users: users,
      user: authUser,
    });
  });
});

router.get("/users", (req, res) => {
  User.find({}, function (err, users) {
    return res.json(users);
  });
});
// Register
router.post("/register", (req, res, next) => {
  let newUser = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    isAdmin: req.body.isAdmin ? req.body.isAdmin : false,
  });
  User.addUser(newUser, (err, user) => {
    if (err) {
      console.log(err);
      return res.json({ response: "false" });
    } else {
      return res.json({ response: "true" });
    }
  });
});

// Authenticate
router.post("/login", (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User.getUserByEmail(email, (err, user) => {
    if (err) throw err;
    if (!user) {
      /** Login error */
      return res.json({
        success: false,
        msg: "User not found",
      });
    }
    User.comparePassword(password, user.password, (err, isMatch) => {
      if (err) throw err;
      if (isMatch) {
        const token = jwt.sign(
          {
            data: user,
          },
          config.secret,
          {
            expiresIn: 604800, // 1 week
          }
        );
        res.json({
          token: token,
          userObj: user,
          user: true
        });
      } else {
        return res.json({
          success: false,
          msg: "Wrong password",
        });
      }
    });
  });
});

/* Profile section */
router.get("/profile", loginRequired, function (req, res, next) {
  const user_id = req.cookies.user_id;
  User.find(
    {
      _id: user_id,
    },
    function (err, found_user) {
      res.render("profile", {
        user: req.cookies.isAdmin,
        found_user: found_user,
      });
    }
  );
});

/** Update User */
router.put("/updateUser/:id", adminLoginRequired, function (req, res, next) {
  const id = req.params.id;
  const updateOps = {};
  for (const [key, value] of Object.entries(req.body)) {
    updateOps[key] = value;
  }
  User.updateOne(
    {
      _id: id,
    },
    {
      $set: updateOps,
    }
  )
    .exec()
    .then((doc) => {
      res.status(200).json(doc);
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

router.get("/deleteUser/:id", adminLoginRequired, (req, res, next) => {
  const id = req.params.id;
  User.remove({
    _id: id,
  })
    .exec()
    .then((doc) => {
      User.find({}, function (err, users) {
        res.render("list_users", {
          users: users,
          message: "deleted",
        });
      });
    })
    .catch((err) => {
      res.status(500).json(err);
    });
});

function loginRequired(req, res, next) {
  let token = req.cookies.jwt;
  // decode token
  if (token) {
    jwt.verify(token, config.secret, function (err, token_data) {
      if (err) {
        return res.status(401).render("unauthenticated");
      } else {
        req.user = req.cookies.isAdmin;
        next();
      }
    });
  } else {
    res.status(401).render("unauthenticated");
  }
}

function adminLoginRequired(req, res, next) {
  let token = req.cookies.jwt;
  let isAdmin = req.cookies.isAdmin;
  // decode token
  if (token && isAdmin) {
    jwt.verify(token, config.secret, function (err, token_data) {
      if (err) {
        return res.status(401).render("unauthenticated");
      } else {
        req.user = req.cookies.isAdmin;
        next();
      }
    });
  } else {
    res.status(401).render("unauthenticated");
  }
}

module.exports = router;
