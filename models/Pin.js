const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const PinSchema = new mongoose.Schema(
{
    email: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
        min: 3,
        max: 60,
    },
    desc: {
        type: String,
        required: true,
        min: 3,
    },
    rating: {
        type: Number,
        required: true,
        min: 0,
        max: 5,
    },
    price: {
        type: Number,
        // required: true,
    },
    long: {
        type: Number,
        required: true,
    },
    lat: {
        type: Number,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    image: {
        type: [String],
        required: true,
    },
    totalrating: {
        type: Number,
    },
    totalpeoplerating: {
        type: Number,
    },
    averagerate: {
        type: Number,
        required: false,
        min: 0,
        max: 5,
    },
    choosen: {
        type: String,
    },
    comments: [
        {
            text: String,
            created: { type: Date, default: Date.now },
            postedBy: {
                type:Schema.Types.ObjectId,
                ref: "Account",
            },
        },
    ],
    pending: {
        type: Boolean,
        default: true // Mặc định là true (chờ)
    },
    time: {
        type: Date,
    },
    category:{type:Schema.Types.ObjectId, ref:'Category'},
},
{ timestamps: true }
);
module.exports = mongoose.model("Pin", PinSchema);