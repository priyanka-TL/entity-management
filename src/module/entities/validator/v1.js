/**
 * name : v1.js
 * author : Priyanka Pradeep
 * created-date : 21-Mar-2024
 * Description : Entities.
 */

module.exports = (req) => {

    let entitiesValidator = {

    }

    if (entitiesValidator[req.params.method]) {
        entitiesValidator[req.params.method]()
    }

}