const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const GuestSchema = new Schema({
  name: {type: String, required: true},
  dob: {type: Date, required: true},
  gender: {type: String, required: true},
  address: {type: String, required: true},
  image: {type: String, required: false},
  account:{type:Schema.Types.ObjectId, ref:'Account'},
});

const GuestModel = model('Guest', GuestSchema);

module.exports = GuestModel;