/**
 * name : v1.js
 * author : Mallanagouda R Biradar
 * created-date : 30-july-2024
 * Description : userRoleExtension validator.
 */

module.exports = (req) => {
	let userRoleValidator = {
		create: function () {
			req.checkBody('label').exists().withMessage('required label ')
			req.checkBody('entityTypes[0].entityType').exists().withMessage('entityType name ')
			req.checkBody('entityTypes[0].entityTypeId').exists().withMessage('entityTypeId name ')
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
