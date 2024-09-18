/**
 * name : v1.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : EntityTypes.
 */
const { check, validationResult } = require('express-validator')

module.exports = (req, res) => {
	let entityTypesValidator = {
		bulkCreate: function () {
			if (!req.files || !req.files.entityTypes) {
				req.checkBody('entityTypes').exists().withMessage('EntityTypes file is required')
			}
		},
		bulkUpdate: function () {
			if (!req.files || !req.files.entityTypes) {
				req.checkBody('entityTypes').exists().withMessage('EntityTypes file is required')
			}
		},
		update: function () {
			req.checkParams('_id').exists().withMessage('required _id')
			req.checkBody('name').exists().withMessage('required name')
		},
		create: function () {
			req.checkBody('name')
				.exists()
				.withMessage('The name field is required.')
				.trim()
				.notEmpty()
				.withMessage('The name field cannot be empty.')
		},

		find: function () {
			req.checkBody('query').exists().withMessage('required name')
		},
	}

	if (entityTypesValidator[req.params.method]) {
		entityTypesValidator[req.params.method]()
	}
}
