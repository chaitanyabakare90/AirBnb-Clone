const mongoose = require("mongoose");
const review = require("./review");
const { type } = require("os");
const { ref } = require("process");
const { url } = require("inspector");
const Schema = mongoose.Schema;


const listschema = new Schema({
    title :{
        type : String,
        required : true
    },
    description :{
        type : String
    },
    image:{
        url : String,
        filename : String
    },
    price:{
        type : Number
    },
    location:{
        type : String
    },
    country:{
        type : String
    },
    reviews : [
        {
            type : Schema.Types.ObjectId,
            ref : "Review" 
        },
    ],
    owner :{
        type : Schema.Types.ObjectId,
        ref : "User",
    },
    geometry : {
            type: {
                type: String, // Don't do `{ location: { type: String } }`
                enum: ['Point'], // 'location.type' must be 'Point'
                required: true
                },
            coordinates: {
                type: [Number],
                required: true
            }
    }
});
listschema.post("findOneAndDelete",async(listing) =>{
    if(listing){
        await review.deleteMany({_id : {$in : listing.reviews}});
    }
})
const Listing = mongoose.model("Listing",listschema);

module.exports= Listing;
