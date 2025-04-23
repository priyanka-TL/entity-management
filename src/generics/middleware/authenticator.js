/**
 * name : authenticator.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Authentication middleware. Call sunbird service for authentication.
 */

// dependencies
const jwt = require('jsonwebtoken')
const isBearerRequired = process.env.IS_AUTH_TOKEN_BEARER === 'true'
const path = require('path')
const fs = require('fs')
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

	if (!req.rspObj) req.rspObj = {}
	var rspObj = req.rspObj

	token = req.headers['x-auth-token']

	let internalAccessApiPaths = CONSTANTS.common.INTERNAL_ACCESS_URLS
	let performInternalAccessTokenCheck = false
	let adminHeader = false
	if (process.env.ADMIN_ACCESS_TOKEN) {
		adminHeader = req.headers[process.env.ADMIN_TOKEN_HEADER_NAME]
	}

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

	// Check if a Bearer token is required for authentication
	if (isBearerRequired) {
		const [authType, extractedToken] = token.split(' ')
		if (authType.toLowerCase() !== 'bearer') {
			rspObj.errCode = CONSTANTS.apiResponses.TOKEN_INVALID_CODE
			rspObj.errMsg = CONSTANTS.apiResponses.TOKEN_INVALID_MESSAGE
			rspObj.responseCode = HTTP_STATUS_CODE['unauthorized'].status
			return res.status(HTTP_STATUS_CODE['unauthorized'].status).send(respUtil(rspObj))
		}
		token = extractedToken?.trim()
	} else {
		token = token?.trim()
	}

	// <---- For Elevate user service user compactibility ---->
	let decodedToken = null
	try {
		if (process.env.AUTH_METHOD === CONSTANTS.common.AUTH_METHOD.NATIVE) {
			try {
				// If using native authentication, verify the JWT using the secret key
				decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
			} catch (err) {
				// If verification fails, send an unauthorized response
				rspObj.errCode = CONSTANTS.apiResponses.TOKEN_MISSING_CODE
				rspObj.errMsg = CONSTANTS.apiResponses.TOKEN_MISSING_MESSAGE
				rspObj.responseCode = HTTP_STATUS_CODE['unauthorized'].status
				return res.status(HTTP_STATUS_CODE['unauthorized'].status).send(respUtil(rspObj))
			}
		} else if (process.env.AUTH_METHOD === CONSTANTS.common.AUTH_METHOD.KEYCLOAK_PUBLIC_KEY) {
			// If using Keycloak with a public key for authentication
			const keycloakPublicKeyPath = `${process.env.KEYCLOAK_PUBLIC_KEY_PATH}/`
			const PEM_FILE_BEGIN_STRING = '-----BEGIN PUBLIC KEY-----'
			const PEM_FILE_END_STRING = '-----END PUBLIC KEY-----'

			// Decode the JWT to extract its claims without verifying
			const tokenClaims = jwt.decode(token, { complete: true })

			if (!tokenClaims || !tokenClaims.header) {
				// If the token does not contain valid claims or header, send an unauthorized response
				rspObj.errCode = CONSTANTS.apiResponses.TOKEN_MISSING_CODE
				rspObj.errMsg = CONSTANTS.apiResponses.TOKEN_MISSING_MESSAGE
				rspObj.responseCode = HTTP_STATUS_CODE['unauthorized'].status
				return res.status(HTTP_STATUS_CODE['unauthorized'].status).send(respUtil(rspObj))
			}

			// Extract the key ID (kid) from the token header
			const kid = tokenClaims.header.kid

			// Construct the path to the public key file using the key ID
			let filePath = path.resolve(__dirname, keycloakPublicKeyPath, kid.replace(/\.\.\//g, ''))

			// Read the public key file from the resolved file path
			const accessKeyFile = await fs.promises.readFile(filePath, 'utf8')

			// Ensure the public key is properly formatted with BEGIN and END markers
			const cert = accessKeyFile.includes(PEM_FILE_BEGIN_STRING)
				? accessKeyFile
				: `${PEM_FILE_BEGIN_STRING}\n${accessKeyFile}\n${PEM_FILE_END_STRING}`
			let verifiedClaims
			try {
				// Verify the JWT using the public key and specified algorithms
				verifiedClaims = jwt.verify(token, cert, { algorithms: ['sha1', 'RS256', 'HS256'] })
			} catch (err) {
				// If the token is expired or any other error occurs during verification
				if (err.name === 'TokenExpiredError') {
					rspObj.errCode = CONSTANTS.apiResponses.TOKEN_INVALID_CODE
					rspObj.errMsg = CONSTANTS.apiResponses.TOKEN_INVALID_MESSAGE
					rspObj.responseCode = HTTP_STATUS_CODE['unauthorized'].status
					return res.status(HTTP_STATUS_CODE['unauthorized'].status).send(respUtil(rspObj))
				}
			}

			// Extract the external user ID from the verified claims
			const externalUserId = verifiedClaims.sub.split(':').pop()

			const data = {
				id: externalUserId,
				roles: [], // this is temporariy set to an empty array, it will be corrected soon...
				name: verifiedClaims.name,
				organization_id: verifiedClaims.org || null,
			}

			// Ensure decodedToken is initialized as an object
			decodedToken = decodedToken || {}
			decodedToken['data'] = data
		}
		if (adminHeader) {
			if (adminHeader != process.env.ADMIN_ACCESS_TOKEN) {
				return res.status(HTTP_STATUS_CODE['unauthorized'].status).send(respUtil(rspObj))
			}
			if (
				!req.headers['tenantid'] ||
				!req.headers['orgid'] ||
				!req.headers['tenantid'].length ||
				!req.headers['orgid'].length
			) {
				rspObj.errCode = CONSTANTS.apiResponses.INVALID_TENANT_AND_ORG_CODE
				rspObj.errMsg = CONSTANTS.apiResponses.INVALID_TENANT_AND_ORG_MESSAGE
				rspObj.responseCode = HTTP_STATUS_CODE['unauthorized'].status
				return res.status(HTTP_STATUS_CODE['unauthorized'].status).send(respUtil(rspObj))
			}
			decodedToken.data['tenantAndOrgInfo'] = {}

			decodedToken.data.tenantAndOrgInfo['tenantId'] = req.get('tenantid').toString()

			decodedToken.data.tenantAndOrgInfo['orgId'] = req.get('orgid').split(',')
			decodedToken.data.roles.push({ title: CONSTANTS.common.ADMIN_ROLE })
		}
	} catch (err) {
		rspObj.errCode = CONSTANTS.apiResponses.TOKEN_MISSING_CODE
		rspObj.errMsg = CONSTANTS.apiResponses.TOKEN_MISSING_MESSAGE
		rspObj.responseCode = HTTP_STATUS_CODE['unauthorized'].status
		return res.status(HTTP_STATUS_CODE['unauthorized'].status).send(respUtil(rspObj))
	}
	if (!decodedToken) {
		rspObj.errCode = CONSTANTS.apiResponses.TOKEN_MISSING_CODE
		rspObj.errMsg = CONSTANTS.apiResponses.TOKEN_MISSING_MESSAGE
		rspObj.responseCode = HTTP_STATUS_CODE['unauthorized'].status
		return res.status(HTTP_STATUS_CODE['unauthorized'].status).send(respUtil(rspObj))
	}
	req.userDetails = {
		userToken: token,
		userInformation: {
			userId: typeof decodedToken.data.id == 'string' ? decodedToken.data.id : decodedToken.data.id.toString(),
			userName: decodedToken.data.name,
			// email : decodedToken.data.email, //email is removed from token
			firstName: decodedToken.data.name,
			roles: decodedToken.data.roles.map((role) => role.title),
			organizationId: decodedToken.data.organization_id ? decodedToken.data.organization_id.toString() : null,
			tenantId: decodedToken.data.tenant_id.toString(),
		},
	}
	if (decodedToken.data.tenantAndOrgInfo) {
		req.userDetails.tenantAndOrgInfo = decodedToken.data.tenantAndOrgInfo
	}
	next()
}
