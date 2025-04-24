/**
 * name : v1.js
 * author : Mallanagouda R Biradar
 * created-date : 24-Apr-2025
 * Description : Admin.
 */

module.exports = (req) => {
	let adminValidator = {
		createIndex: function () {
			req.checkParams('_id').exists().withMessage('required collection name')
			req.checkBody('keys').exists().withMessage('keys required')
		},
	}

	if (adminValidator[req.params.method]) {
		adminValidator[req.params.method]()
	}
}
