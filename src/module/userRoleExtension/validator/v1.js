/**
 * name : v1.js
 * author : Mallanagouda R Biradar
 * created-date : 30-july-2024
 * Description : userRoleExtension validator.
 */

module.exports = (req) => {
	let userRoleValidator = {
		create: function () {
			// req.checkBody('title').exists().withMessage('required title ')
			req.checkBody('entityTypes[0].entityType').exists().withMessage('entityType name ')
			req.checkBody('entityTypes[0].entityTypeId').exists().withMessage('entityTypeId name ')
			req.checkBody('title')
				.exists()
				.withMessage('The title field is required.')
				.trim() // Removes leading and trailing spaces
				.notEmpty()
				.withMessage('The title field cannot be empty.')
			req.checkBody('userRoleId')
				.exists()
				.withMessage('The userRoleId field is required.')
				.trim() // Removes leading and trailing spaces
				.notEmpty()
				.withMessage('The userRoleId field cannot be empty.')
		},
		update: function () {
			req.checkBody('title').exists().withMessage('required title')
			req.checkParams('_id').exists().withMessage('required _id')
		},
		find: function () {
			req.checkBody('query').exists().withMessage('required query')
		},
		delete: function () {
			req.checkParams('_id').exists().withMessage('required id')
		},
	}

	if (userRoleValidator[req.params.method]) {
		userRoleValidator[req.params.method]()
	}
}
