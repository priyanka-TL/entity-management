/**
 * name : envVariables.js.
 * author : Priyanka Pradeep.
 * created-date : 20-March-2024.
 * Description : Required Environment variables .
 */

const Log = require('log')
let log = new Log('debug')
let table = require('cli-table')

let tableData = new table()

let enviromentVariables = {
	APPLICATION_PORT: {
		message: 'Please specify the value for e.g. 5001',
		optional: false,
	},
	APPLICATION_ENV: {
		message: 'Please specify the value for e.g. local/development/qa/production',
		optional: false,
	},
	MONGODB_URL: {
		message: 'Required mongodb url',
		optional: false,
	},
	INTERNAL_ACCESS_TOKEN: {
		message: 'Required internal access token',
		optional: false,
	},
	API_DOC_URL: {
		message: 'Required api doc url',
		optional: false,
	},
	IS_AUTH_TOKEN_BEARER: {
		message: 'Required specification: If auth token is bearer or not',
		optional: true,
		default: false,
	},
	AUTH_METHOD: {
		message: 'Required authentication method',
		optional: true,
		default: CONSTANTS.common.AUTH_METHOD.NATIVE,
	},
	KEYCLOAK_PUBLIC_KEY_PATH: {
		message: 'Required Keycloak Public Key Path',
		optional: true,
		default: '../keycloakPublicKeys',
	},
	ADMIN_TOKEN_HEADER_NAME: {
		message: 'Required admin access token header name',
		optional: true,
		default: 'admin-auth-token',
	},
	ADMIN_ACCESS_TOKEN: {
		message: 'Required admin access token',
		optional: false,
	},
}

let success = true

module.exports = function () {
	Object.keys(enviromentVariables).forEach((eachEnvironmentVariable) => {
		let tableObj = {
			[eachEnvironmentVariable]: 'PASSED',
		}

		let keyCheckPass = true
		let validRequiredIfOperators = ['EQUALS', 'NOT_EQUALS']

		if (
			enviromentVariables[eachEnvironmentVariable].optional === true &&
			enviromentVariables[eachEnvironmentVariable].requiredIf &&
			enviromentVariables[eachEnvironmentVariable].requiredIf.key &&
			enviromentVariables[eachEnvironmentVariable].requiredIf.key != '' &&
			enviromentVariables[eachEnvironmentVariable].requiredIf.operator &&
			validRequiredIfOperators.includes(enviromentVariables[eachEnvironmentVariable].requiredIf.operator) &&
			enviromentVariables[eachEnvironmentVariable].requiredIf.value &&
			enviromentVariables[eachEnvironmentVariable].requiredIf.value != ''
		) {
			switch (enviromentVariables[eachEnvironmentVariable].requiredIf.operator) {
				case 'EQUALS':
					if (
						process.env[enviromentVariables[eachEnvironmentVariable].requiredIf.key] ===
						enviromentVariables[eachEnvironmentVariable].requiredIf.value
					) {
						enviromentVariables[eachEnvironmentVariable].optional = false
					}
					break
				case 'NOT_EQUALS':
					if (
						process.env[enviromentVariables[eachEnvironmentVariable].requiredIf.key] !=
						enviromentVariables[eachEnvironmentVariable].requiredIf.value
					) {
						enviromentVariables[eachEnvironmentVariable].optional = false
					}
					break
				default:
					break
			}
		}

		if (enviromentVariables[eachEnvironmentVariable].optional === false) {
			if (!process.env[eachEnvironmentVariable] || process.env[eachEnvironmentVariable] == '') {
				success = false
				keyCheckPass = false
			} else if (
				enviromentVariables[eachEnvironmentVariable].possibleValues &&
				Array.isArray(enviromentVariables[eachEnvironmentVariable].possibleValues) &&
				enviromentVariables[eachEnvironmentVariable].possibleValues.length > 0
			) {
				if (
					!enviromentVariables[eachEnvironmentVariable].possibleValues.includes(
						process.env[eachEnvironmentVariable]
					)
				) {
					success = false
					keyCheckPass = false
					enviromentVariables[eachEnvironmentVariable].message += ` Valid values - ${enviromentVariables[
						eachEnvironmentVariable
					].possibleValues.join(', ')}`
				}
			}
		}

		if (
			(!process.env[eachEnvironmentVariable] || process.env[eachEnvironmentVariable].trim() === '') &&
			enviromentVariables[eachEnvironmentVariable]?.optional === true &&
			enviromentVariables[eachEnvironmentVariable]?.default !== undefined
		) {
			process.env[eachEnvironmentVariable] = enviromentVariables[eachEnvironmentVariable].default
			keyCheckPass = true
			success = true
		}

		if (!keyCheckPass) {
			if (enviromentVariables[eachEnvironmentVariable].message !== '') {
				tableObj[eachEnvironmentVariable] = enviromentVariables[eachEnvironmentVariable].message
			} else {
				tableObj[eachEnvironmentVariable] = `FAILED - ${eachEnvironmentVariable} is required`
			}
		}
		tableData.push(tableObj)
	})

	log.info(tableData.toString())
	return {
		success: success,
	}
}
