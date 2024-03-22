/**
 * name : index.js.
 * author : Aman Karki.
 * created-date : 01-Feb-2021.
 * Description : Health check Root file.
*/

let healthCheckService = require("./health-check")

module.exports = function (app) {
    app.get("/health", healthCheckService.health_check)
    app.get("/healthCheckStatus", healthCheckService.healthCheckStatus)
}