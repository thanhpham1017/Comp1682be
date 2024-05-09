const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const RoleSchema = new Schema({
  role: {
    type: String,
    required: [true],
    unique: [true, '{VALUE} is existed']
  },
  description: String,
});

const RoleModel = model('Role', RoleSchema);

module.exports = RoleModel;