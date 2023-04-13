const User = require("../models/User").User;
const mongoose = require("mongoose");

const createUser = async (user, res) => {
	return await new User(user)
		.save()
		.then(() => {
			console.log("User Successfully registered!");
			res.render("secrets");
		})
		.catch((err) => console.log(err));
};
module.exports = {
	createUser,
};
