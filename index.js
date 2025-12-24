if(process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const { error } = require("console");
const Review = require("./models/review.js");

const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const db_url = process.env.ATLASDB_URL;
main().then(() => {
    console.log("connection successful");
}).catch((err) => {
    console.log(err);
})
async function main() {
    await mongoose.connect(db_url); //we have to paste link provided by mongo atlass
}
app.get("/", (req, res) => {
    res.redirect("/listings");
})


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));


const store= MongoStore.create({
    mongoUrl:db_url,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter : 24*3600,
 }); 
 store.on("error",()=>{
    console.log("ERROR IN MONGO STORE".err);
 })
const sessionOptions = {
    store,
    secret :process.env.SECRET,
    resave : false,
    saveUninitialized  : true,
    cookie :{
        expires : Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge : 7 * 24 * 60 * 60 * 1000,
        httpOnly : true,
    },
}
app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})


app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// app.get("/demouser", async(req,res) =>{
//     let fakeuser = new User({
//         email : "Chaitu@gmail.com",
//         username : "Chaitu",
//     })
//     let registeredUser = await User.register(fakeuser,"HelloChaitu");
//     res.send(registeredUser);
// })

app.use((req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
})
app.use((err, req, res, next) => {
    let { status = 500, message = "Something went wrong" } = err;
    // res.status(status).send(message);
    console.log(err);
    res.status(status).render("listings/error.ejs", { message });
});
app.listen(8080, () => {
    console.log("Server is Listening");
})
// app.get("/testListing" , async (req,res) =>{
//     let samplelist = new Listing({
//         title : "Chaitanya's Villa",
//         description : "By the beach",
//         price : 5000,
//         location:"Goa",
//         country : "India",
//     })
//     await samplelist.save();
//     console.log(samplelist);
//     res.send("Connection was successful");
// })
