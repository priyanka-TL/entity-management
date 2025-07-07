# Health Check Configuration Guide

This project uses the `elevate-services-health-check` package to perform health checks for internal components like MongoDB, Kafka, and dependent microservices.

To enable this, create a configuration file (`health.config.js`) that defines what to check and how.

---

## ✅ Sample Configuration

```js
module.exports = {
	name: 'EntityManagementService', // 🔹 Service name shown in health check response
	version: '1.0.0', // 🔹 Service version shown in response

	checks: {
		mongodb: {
			enabled: true, // ✅ Required if MongoDB is used
			url: process.env.MONGODB_URL, // 🔐 Recommended: use env variable
		},
		microservices: [
			{
				name: 'UserService',
				url: `${process.env.USER_SERVICE_URL}/user/health?serviceName=${process.env.SERVICE_NAME}`,
				enabled: true,
				request: {
					method: 'GET',
					header: {},
					body: {},
				},

				expectedResponse: {
					status: 200,
					'params.status': 'successful',
					'result.healthy': true,
				},
			},
		],
	},
}
```
