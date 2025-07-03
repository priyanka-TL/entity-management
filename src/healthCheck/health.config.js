/**
 * name : health.config.js.
 * author : Mallanagouda R Biradar
 * created-date : 30-Jun-2025
 * Description : Health check config file
 */

module.exports = {
	name: 'EntityManagementService',
	version: '1.0.0',
	checks: {
		mongodb: {
			enabled: true,
			url: process.env.MONGODB_URL,
		},
		microservices: [
			{
				name: 'UserService',
				url: 'http://localhost:3001/user/health?serviceName=EntityManagementService', // Replace with actual URL - use environment variable if needed
				enabled: true,
				request: {
					method: 'GET',
					header: {
						'internal-access-token': process.env.INTERNAL_TOKEN,
					},
					body: {},
				},

				expectedResponse: {
					status: 200,
					'params.status': 'successful',
				},
			},
		],
	},
}
