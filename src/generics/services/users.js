const request = require('request')

const interfaceServiceUrl = process.env.INTERFACE_SERVICE_URL

const fetchOrgDetails = function (organisationIdentifier, userToken) {
	return new Promise(async (resolve, reject) => {
		try {
			let url
			if (!isNaN(organisationIdentifier)) {
				url =
					interfaceServiceUrl +
					process.env.USER_SERVICE_BASE_URL +
					CONSTANTS.endpoints.ORGANIZATION_READ +
					'?organisation_id=' +
					organisationIdentifier
			} else {
				url =
					interfaceServiceUrl +
					process.env.USER_SERVICE_BASE_URL +
					CONSTANTS.endpoints.ORGANIZATION_READ +
					'?organisation_code=' +
					organisationIdentifier
			}
			const options = {
				headers: {
					internal_access_token: process.env.INTERNAL_ACCESS_TOKEN,
				},
			}
			request.get(url, options, userReadCallback)
			let result = {
				success: true,
			}
			function userReadCallback(err, data) {
				if (err) {
					result.success = false
				} else {
					let response = JSON.parse(data.body)
					if (response.responseCode === HTTP_STATUS_CODE['ok'].code) {
						result['data'] = response.result
						result.success = true
					} else {
						result.success = false
					}
				}
				return resolve(result)
			}
			setTimeout(function () {
				return resolve(
					(result = {
						success: false,
					})
				)
			}, CONSTANTS.common.SERVER_TIME_OUT)
		} catch (error) {
			return reject(error)
		}
	})
}

module.exports = {
	fetchOrgDetails: fetchOrgDetails,
}
