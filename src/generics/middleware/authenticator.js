/**
 * name : authenticator.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Authentication middleware. Call sunbird service for authentication.
 */

// dependencies
const jwt = require('jsonwebtoken')

var respUtil = function (resp) {
	return {
		status: resp.errCode,
		message: resp.errMsg,
		currentDate: new Date().toISOString(),
	}
}

var removedHeaders = [
	'host',
	'origin',
	'accept',
	'referer',
	'content-length',
	'accept-encoding',
	'accept-language',
	'accept-charset',
	'cookie',
	'dnt',
	'postman-token',
	'cache-control',
	'connection',
]

module.exports = async function (req, res, next, token = '') {
	removedHeaders.forEach(function (e) {
		delete req.headers[e]
	})

	var token = req.headers['x-auth-token']
	if (!req.rspObj) req.rspObj = {}
	var rspObj = req.rspObj

	let internalAccessApiPaths = CONSTANTS.common.INTERNAL_ACCESS_URLS
	let performInternalAccessTokenCheck = false
	await Promise.all(
		internalAccessApiPaths.map(async function (path) {
			if (req.path.includes(path)) {
				performInternalAccessTokenCheck = true
			}
		})
	)

	if (performInternalAccessTokenCheck) {
		if (req.headers['internal-access-token'] !== process.env.INTERNAL_ACCESS_TOKEN) {
			rspObj.errCode = CONSTANTS.apiResponses.TOKEN_MISSING_CODE
			rspObj.errMsg = CONSTANTS.apiResponses.TOKEN_MISSING_MESSAGE
			rspObj.responseCode = HTTP_STATUS_CODE['unauthorized'].status
			return res.status(HTTP_STATUS_CODE['unauthorized'].status).send(respUtil(rspObj))
		}
		if (!token) {
			next()
			return
		}
	}

	if (!token) {
		rspObj.errCode = CONSTANTS.apiResponses.TOKEN_MISSING_CODE
		rspObj.errMsg = CONSTANTS.apiResponses.TOKEN_MISSING_MESSAGE
		rspObj.responseCode = HTTP_STATUS_CODE['unauthorized'].status
		return res.status(HTTP_STATUS_CODE['unauthorized'].status).send(respUtil(rspObj))
	}

	rspObj.errCode = CONSTANTS.apiResponses.TOKEN_INVALID_CODE
	rspObj.errMsg = CONSTANTS.apiResponses.TOKEN_INVALID_MESSAGE
	rspObj.responseCode = HTTP_STATUS_CODE['unauthorized'].status

	// <---- For Elevate user service user compactibility ---->
	try {
		decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
	} catch (err) {
		return res.status(HTTP_STATUS_CODE['unauthorized'].status).send(respUtil(rspObj))
	}
	if (!decodedToken) {
		return res.status(HTTP_STATUS_CODE['unauthorized'].status).send(respUtil(rspObj))
	}

	req.userDetails = {
		userToken: token,
		userInformation: {
			userId: decodedToken.data.id.toString(),
			userName: decodedToken.data.name,
			// email : decodedToken.data.email, //email is removed from token
			firstName: decodedToken.data.name,
			roles: decodedToken.data.roles.map((role) => role.title),
			entityTypes: 'state',
		},
	}
	next()
}
