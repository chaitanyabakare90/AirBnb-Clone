const Joi = require('joi');
const { title } = require('process');

module.exports.listingSchema = Joi.object({
    listings : Joi.object({
        title : Joi.string().required(),
        description : Joi.string().required(),
        country : Joi.string().required(),
        location : Joi.string().required(),
        price : Joi.number().required().min(0) ,    //the price should not be negative
        image: Joi.object({
            url: Joi.string(),
            filename: Joi.string()
        })
    }).required()
})

module.exports.reviewSchema = Joi.object({
    review : Joi.object({
        rating : Joi.number().required().min(0).max(5),
        comment : Joi.string().required()
    }).required()
})