const mongoose = require('mongoose');
const {Schema,model,ObjectId } = mongoose;

const PostSchema = new Schema({
  title:String,
  summary:String,
  content:String,
  cover:String,
  author:{type:Schema.Types.ObjectId, ref:'Account'},
  likes: [{ type:Schema.Types.ObjectId, ref: "Account" }],
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
}, {
  timestamps: true,
});

const PostModel = model('Post', PostSchema);

module.exports = PostModel;