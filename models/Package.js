const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const PackageSchema = new Schema({
  package: {
    type: String,
    required: [true],
    unique: [true, '{VALUE} is existed']
  },
  time: {
    type: Number,
    required: [true],
  },
  description: String,
});

const PackageModel = model('Package', PackageSchema);

module.exports = PackageModel;