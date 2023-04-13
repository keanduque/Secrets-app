/**
 * Title : Secrets App
 * Author : Kean Duque
 */
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");

const app = express();
const PORT = 3000 || process.env.PORT;
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// use Session
app.use(
	session({
		secret: "Our little secret.",
		resave: false,
		saveUninitialized: false,
	})
);
// use Passport
app.use(passport.initialize());
app.use(passport.session());

const ConnectDB = require("./server");
const user = require("./controllers/user");
const User = require("./models/User").User;

// Connect to DB
ConnectDB()
	.then(() =>
		app.listen(PORT, () => console.log(`Server started on PORT:${PORT}`))
	)
	.catch((err) => console.log(err));

app.get("/", (req, res) => {
	res.render("home");
});

// google OAuth - authentication
app.get(
	"/auth/google",
	passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
	"/auth/google/secrets",
	passport.authenticate("google", {
		successRedirect: "/secrets",
		failureRedirect: "/login",
	}),
	function (req, res) {
		// Successful authentication, redirect secrets.
		console.log("Connected to your google Account!");
		res.redirect("/secrets");
	}
);

// facebook OAuth - authentication
app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
	"/auth/facebook/secrets",
	passport.authenticate("facebook", { failureRedirect: "/login" }),
	function (req, res) {
		// Successful authentication, redirect secrets.
		console.log("Connected to your facebook Account!");
		res.redirect("/secrets");
	}
);

//Cookies Session when accessing directly
app.get("/secrets", (req, res) => {
	User.find({ secret: { $ne: null } })
		.then((userFound) => {
			res.render("secrets", {
				userWithSecrets: userFound,
				isAuthenticated: req.isAuthenticated(),
			});
		})
		.catch((err) => console.log(err));
});
app.route("/submit")
	.get(async (req, res) => {
		if (req.isAuthenticated()) {
			res.render("submit");
		} else {
			res.redirect("/login");
		}
	})
	.post(async (req, res) => {
		const submittedSecret = req.body.secret;

		await User.findByIdAndUpdate(
			{ _id: req.user.id },
			{
				$set: { secret: submittedSecret },
			},
			{ upsert: true }
		)
			.then((userFound) => {
				console.log(userFound);
				res.redirect("/secrets");
			})
			.catch((err) => console.log(err));
	});

// Logout
app.get("/logout", (req, res) => {
	req.logout((err) => {
		if (err) {
			return next(err);
		}
		req.session.destroy();
		res.redirect("/");
	});
});

// register
app.route("/register")
	.get(async (req, res) => {
		res.render("register");
	})
	.post(async (req, res) => {
		//register is from passport-local-mongoose plugin

		console.log("registerK:", req.body.username);

		User.register(
			{ username: req.body.username },
			req.body.password,
			(err, user) => {
				if (err) {
					console.log(err);
					res.redirect("/register");
				} else {
					passport.authenticate("local")(req, res, () => {
						res.redirect("/secrets");
					});
				}
			}
		);
	});

//login
app.route("/login")
	.get(async (req, res) => {
		res.render("login");
	})
	.post(async (req, res) => {
		const user = new User({
			username: req.body.username,
			password: req.body.password,
		});

		req.login(user, (err) => {
			console.log(user);
			if (err) {
				console.log(err);
			} else {
				passport.authenticate("local")(req, res, () => {
					res.redirect("/secrets");
				});
			}
		});
	});
// when updating code the server will restart and session will end.
