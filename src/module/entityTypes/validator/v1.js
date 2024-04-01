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
		// find: function () {
		// 	req.checkBody('query').exists().withMessage('query is required')
		// },
	}

	if (entityTypesValidator[req.params.method]) {
		entityTypesValidator[req.params.method]()
	}
}
