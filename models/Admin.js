const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const AdminSchema = new Schema({
   name: {type: String, required: true},
   dob: {type: Date, required: true},
   gender: {type: String, required: true},
   address: {type: String, required: true},
   image: {type: String, required: true},
   account:{type:Schema.Types.ObjectId, ref:'Account'},
});

const AdminModel = model('Admin', AdminSchema);

module.exports = AdminModel;