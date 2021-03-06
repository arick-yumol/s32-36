const User = require("../models/User");	// ../models/User.js
const Course = require("../models/Course");	// ../models/Course.js
const bcrypt = require('bcrypt');		// npm install bcrypt --save (npm install --save bcyptjs: alternative to npm install bcrypt)
const auth = require('../auth');

// Check if the e-mail already exists

/*
Steps:
1. Use mongoose .find() method to find duplicate e-mails
2. Use the .then() method to send a response back to the client based on the result of the .find() method (e-mail already exists/not existing)

*/
module.exports.checkEmailExists = (reqBody) => {
	return User.find( {email: reqBody.email } ).then(result => {
		// The .find() method returns a record if a match is found
		if (result.length > 0) {
			return true;
		}
		else {
			// No duplicate email found
			// The user is not yet registered in the database
			return false;
		}
	})
}

// User Registration
/*
Steps:
1.Create a new User object using the mongoose model and the information from the request body.
2. Error handling, if error, return error. else, Save the new User to the database

*/
module.exports.registerUser = (reqBody) => {

// Uses the information from the reques body to provide all the necessary information
	let newUser = new User({
		firstName: reqBody.firstName,
		lastName: reqBody.lastName,
		email: reqBody.email,
		mobileNo: reqBody.mobileNo,
		// 10 is the value provided as the number of "salt" rounds that the bcrypt algorithm will run in order to encrypt the password
		password: bcrypt.hashSync(reqBody.password, 10)
	})

	// saves the created object to our database
	return newUser.save().then((user, error) => {
		// User registration failed
		if (error) {
			return false;
		}
		else {
			// User registration is successful
			return true;
		}
	})
}


// User authentication
/*
Steps:
1. Check the database if the user's e-mail exists
2. Compare the password provided in the login form with the password stored in the database
3.Generate/return a JSON web token if the user is successfully logged in and return false if not

*/

module.exports.loginUser = (reqBody) => {
	return User.findOne( {email: reqBody.email} ).then(result => {
		// If user does not exist
		if (result == null) {
			return false;
		}
		else {
			// user exists
			// Create a variable "isPasswordCorrect" to return the result of comparing the login form password and the database password
			// .compareSync() method is used to compare a non-encrypted password from the login to the encrypted password retrieved from the database and returns "true" or "false" value depending on the result
			// A good practice for boolean variable/constants is to use the word "is" or "are" at the beginning in the form of is+Noun
				// ex. isSingle, isDone, isAdmin, areDone, etc.
			const isPasswordCorrect = bcrypt.compareSync(reqBody.password, result.password)
			// if the passwords match/result of the above code is true
			if (isPasswordCorrect) {
				// Generate an access token
				// Use the .createAccessToken() method defined in the auth.js file
				// returning an object back to the frontend
				// we will use the mongoose method .toObject() = it converts the mongoose object into a plain Javascript object.
				return { accessToken: auth.createAccessToken(result.toObject()) }
			}
			else {
				// Passwords do no match
				return false;
			}
		}
	})
}

/*s33 activity*/
// #2. Create a getProfile controller method for retrieving the details of the user:
	// a. Find the document in the database using the user's ID
	// b. Reassign the password of the returned document to an empty string
	// c. Return the result back to the frontend

module.exports.getProfile = (reqBody) => {
	return User.findById(reqBody.userId).then(resultProfile => {
		if (resultProfile == null) {
			return false;
		}
		else {
			resultProfile.password = "";
			return resultProfile;
		}
	})
}

/*module.exports.getProfileGET = (reqBody) => {
	return User.findById( {_id: reqBody._id} ).then((resultProfile, err) => {
		if (err) {
			console.log(err);
			return false;
		}
		else {
			resultProfile.password = "";
			return resultProfile;
		}
	})
}*/


/*// s33 activity solution by Ma'am Judy Lyn Medalla
module.exports.getProfile = (data) => {
	return User.findById( data.userId ).then(result => {
		result.password = "";	// result.password = undefined;
		return result;
	})
}*/


/*// Enroll a user to a class/course
Steps:
1. Find the document in the database using the user's ID
2. Add the course ID to the user's enrollment array, vice versa with the enrollees array
3. Save the data in the Database
4. Find the document in the database using the course's ID
5. Add the User ID to the course's enrollees array
6. Save the data in the database
7. Error handling: if successful, return true; else, return false
*/

// Async-await will be used in enrolling the user because we will need to update 2 separate documents when enrolling a user.

module.exports.enroll = async (data) => {
	// Creates an "isUserUpdated" variable and returns true upon successful update, otherwise, false
	// Using the "await" keyword will allow the enroll method to continue updating the user before returning a response back to the client
	let isUserUpdated = await User.findById(data.userId).then(user => {	// step 1
		// Add the courseId in the user's enrollments array
		user.enrollments.push( { courseId: data.courseId } )	// step 2

		// Saves the updated user information in the database.
		return user.save().then((user, error) => {	// step 3
			if (error) {
				return false;
			}
			else {
				return true;
			}
		})	// the "isUserUpdated" variable tells us if the course was successfully added to the user
	})

	let isCourseUpdated = await Course.findById(data.courseId).then(course => {	// step 4
		// Add the userId in the course's enrollees array
		course.enrollees.push( { userId: data.userId } );	// step 5

		return course.save().then((course, error) => {	// step 6
			if (error) {
				return false;
			}
			else {
				return true;
			}
		})	// the "isCourseUpdated" variable tells us if the user was successfully saved to the course
	})

	// Condition that will check if the user and course documents
	// step 7
	if (isUserUpdated && isCourseUpdated) {
		return true;
	}
	else {
		// if user enrollment failed
		return false;
	}
}