const express = require('express');
const Post = require('../models/Post');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');
const BloggerModel = require('../models/Blogger');

const router = express.Router();
const { verifyToken, checkBlogger } = require('../middlewares/auth');
const { text } = require('body-parser');
const { nextTick } = require('process');
const AdminModel = require('../models/Admin');
const AccountModel = require('../models/Account');

const main = require('../index');


router.post('/post', verifyToken, uploadMiddleware.single('file'), async (req,res) => {
  try {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
    // Get the accountId from the verified token
    const accountId = req.accountId.username;
    console.log(accountId);
    // Find the Blogger document based on the username
    const blogger = await AccountModel.findOne({ username: accountId });
    //console.log(blogger);
    if (!blogger) {
      return res.status(404).json({ success: false, error: "Blogger not found" });
    }
    // Extract the ObjectId of the author
    const authorId = blogger._id;
    // Extract other properties from the request body
    const { title, summary, content, likes, comments } = req.body;
    // Create a new post with the retrieved author ObjectId
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover: newPath,
      author: authorId, // Use the ObjectId of the author
    });

    res.json(postDoc);
  } catch (error) {
    console.error("Error while creating post:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});


router.put('/post', verifyToken, checkBlogger , uploadMiddleware.single('file'), async (req,res) => {
  let newPath = null;
  if (req.file) {
    const {originalname,path} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    newPath = path+'.'+ext;
    fs.renameSync(path, newPath);
  }
    const accountId = req.accountId._id;
    const {id,title,summary,content} = req.body;
    const postDoc = await Post.findById(id);
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(accountId);
    //console.log(isAuthor);
    if (!isAuthor) {
      return res.status(400).json('you are not the author');
    }
    
    await postDoc.updateOne({
      title,
      summary,
      content,
      cover: newPath ? newPath : postDoc.cover,
    });
    res.json(postDoc);

});

router.get('/post', async (req,res) => {
  res.json(
    await Post.find()
      .populate('author', ['username'])
      .sort({createdAt: -1})
      .limit(20)
  );
});



router.get('/post/:id', async (req, res) => {
  const {id} = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']).populate('comments.postedBy', 'username');
  res.json(postDoc);
});

router.delete('/post/delete/:id', verifyToken, async (req, res) => {
  try {
    const accountId = req.accountId._id;
    const { id } = req.params; // Sử dụng req.params thay vì req.body để lấy id
    const postDoc = await Post.findById(id);

    if (!postDoc) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(accountId);
    if (!isAuthor) {
      return res.status(400).json('You are not the author');
    }

    const deletePost = await Post.findByIdAndDelete(id);

    if (!deletePost) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error while deleting post:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.put('/post/comment/:id', verifyToken, async (req, res) => {
  const accountId = req.accountId._id;
  const { comment } = req.body;
  try {
    const blogComment = await Post.findByIdAndUpdate(req.params.id, {
      $push: { comments: { text: comment, postedBy: accountId } }
    }, { new: true });

    // Lấy thông tin về người đăng comment (username và email)
    const blog = await Post.findById(blogComment._id).populate('comments.postedBy', 'username email');
    res.status(200).json({ success: true, blog });
  } catch (error) {
    next(error);
  }
});

router.put('/post/addLike/:id', verifyToken, async (req, res) => {
  try {
    const accountId = req.accountId._id;
    const post = await Post.findByIdAndUpdate(req.params.id, {
      $addToSet: { likes: accountId }
    },
    { new: true }
    );
    const posts = await Post.find().sort({ createdAt: -1 }).populate('author', 'username');
    //main.io.emit('add-like', posts); // Emitting add-like event to all connected clients
    main.io.emit('add-like', { postId: req.params.id, likes: post.likes });
    res.status(200).json({
      success: true,
      post,
      posts
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});
router.put('/post/removeLike/:id', verifyToken, async (req, res) => {
  try {
    const accountId = req.accountId._id;
    const post = await Post.findByIdAndUpdate(req.params.id, {
        $pull: { likes: accountId }
    },
        { new: true }
    );
    const posts = await Post.find().sort({ createdAt: -1 }).populate('author', 'username');
    //main.io.emit('remove-like', posts); // Emitting remove-like event to all connected 
    main.io.emit('remove-like', { postId: req.params.id, likes: post.likes });
    res.status(200).json({
        success: true,
        post
    })

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;