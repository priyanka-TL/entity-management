/**
 * name : v1.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Entities.
 */

module.exports = (req) => {

    let entitiesValidator = {

        bulkCreate: function () {
            // req.checkParams('_id').exists().withMessage("required project id");
            // req.checkQuery('lastDownloadedAt').exists().withMessage("required last downloaded at");
            // console.log(req.files,"line no");
            // if (!req.files || !req.files.entities) {

            //     req.checkBody('entities').exists().withMessage("entities file is required");
                
            // }
        }

    }

    if (entitiesValidator[req.params.method]) {
        entitiesValidator[req.params.method]()
    }

}