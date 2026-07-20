const mongoose = require("mongoose");
const review = require("./review");
const Schema = mongoose.Schema;

const listschema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        image: {
            url: {
                type: String,
                default: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157",
            },
            filename: String,
        },
        price: {
            type: Number,
            min: 0,
        },
        location: {
            type: String,
        },
        country: {
            type: String,
        },
        reviews: [
            {
                type: Schema.Types.ObjectId,
                ref: "Review",
            },
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        geometry: {
            type: {
                type: String,
                enum: ["Point"],
                required: true,
            },
            coordinates: {
                type: [Number],
                required: true,
            },
        },
    },
    { timestamps: true }
);

listschema.index({ geometry: "2dsphere" });

listschema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listschema);

module.exports = Listing;