/**
 * name : v1.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : EntityTypes.
 */

module.exports = (req) => {

    let entityTypesValidator = {

        bulkCreate: function () {
            // req.checkParams('_id').exists().withMessage("required project id");
            // req.checkQuery('lastDownloadedAt').exists().withMessage("required last downloaded at");
        }

    }

    if (entityTypesValidator[req.params.method]) {
        entityTypesValidator[req.params.method]()
    }

}