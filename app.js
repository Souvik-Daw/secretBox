//jshint esversion:6
const express =require("express");
const bodyParse=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session = require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");

const app=express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParse.urlencoded({extended:true}));
app.use(session({
    secret: 'this is secret key',
    resave: false,
    saveUninitialized: true
  }));

  app.use(passport.initialize());
  app.use(passport.session());
mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);
const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);



const User= mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
    res.render("home");
});
app.get("/login",function(req,res){
    res.render("login");
});
app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
      if (err){
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("secrets", {usersWithSecrets: foundUsers});
        }
      }
    });
  });

app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate('local', function(err2, user3, info) {
            if (err2) {
                 //return next(err); 
                }
            if (!user3) {
                // return res.redirect('/login');
                 }
            req.logIn(user, function(err1) {
              if (err1) { 
                  //return next(err); 
                }
                res.redirect("/secrets");
            });
          })(req, res);
      }
    });
    //res.redirect("/secrets");
  });

  app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
  });

  app.get("/submit", function(req, res){
    if (req.isAuthenticated()){
      res.render("submit");
    } else {
      res.redirect("/login");
    }
  });

  app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
    User.findById(req.user.id, function(err, foundUser){
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          foundUser.secret = submittedSecret;
          foundUser.save(function(){
            res.redirect("/secrets");
          });
        }
      }
    });
  });


app.post("/login",function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
      });
    
      req.login(user, function(err){
        if (err) {
          console.log(err);
        } else {
            passport.authenticate('local', function(err2, user3, info) {
                if (err2) {
                     //return next(err); 
                    }
                if (!user3) {
                    // return res.redirect('/login');
                     }
                req.logIn(user, function(err1) {
                  if (err1) { 
                      //return next(err); 
                    }
                    res.redirect("/secrets");
                });
              })(req, res);
        }
      });
});
 

app.listen(3000,function(){
    console.log("Server started");
})