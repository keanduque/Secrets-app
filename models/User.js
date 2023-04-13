const mongoose = require("mongoose");
const { Schema } = mongoose;
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const userSchema = new Schema({
	email: {
		type: String,
	},
	password: {
		type: String,
	},
	googleId: {
		type: String,
	},
	facebookId: {
		type: String,
	},
	secret: {
		type: String,
	},
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// documentation from passport when using serialize https://www.passportjs.org/tutorials/password/session/
passport.serializeUser(function (user, cb) {
	process.nextTick(function () {
		cb(null, {
			id: user.id,
			username: user.username,
		});
	});
});
passport.deserializeUser(function (user, cb) {
	process.nextTick(function () {
		return cb(null, user);
	});
});

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL: "http://localhost:3000/auth/google/secrets",
		},
		function (accessToken, refreshToken, profile, cb) {
			// npm i mongoose-findorcreate
			User.findOrCreate(
				{ googleId: profile.id, username: profile.emails[0].value },
				function (err, user) {
					return cb(err, user);
				}
			);
		}
	)
);
passport.use(
	new FacebookStrategy(
		{
			clientID: process.env.FB_APP_ID,
			clientSecret: process.env.FB_APP_SECRET,
			callbackURL: "http://localhost:3000/auth/facebook/secrets",
			profileFields: ["id", "displayName", "name", "email"],
			passReqToCallback: true,
		},
		function (req, accessToken, refreshToken, profile, cb) {
			console.log(profile);
			User.findOrCreate(
				{
					facebookId: profile.id,
					username: !profile.username
						? profile.displayName
						: profile.username,
				},
				function (err, user) {
					return cb(err, user);
				}
			);
		}
	)
);

module.exports = {
	User: User,
};
