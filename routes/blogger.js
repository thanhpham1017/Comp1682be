const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');
const router = express.Router();

const BloggerModel = require('../models/Blogger');
const AccountModel = require('../models/Account');


const {verifyToken, checkBlogger, checkAdmin} = require('../middlewares/auth');

const salt = bcrypt.genSaltSync(10);

// //-------------------------------------------------------------------------
// // Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Set the destination folder where uploaded files will be stored
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now()); // Set the filename to avoid name conflicts
    }
});

const upload = multer({ storage: storage });

//-----------------------------------------------------------------------------------------------
//for Admin
//------------------------------------------------------------------------
// Route to get all bloggers
router.get('/blogger', verifyToken, checkAdmin, async (req, res) => {
    try {
        res.json(await BloggerModel.find().populate('Account'));
    } catch (error) {
        console.error("Error while fetching blogger list:", error);
        res.json({ success: false, error: "Internal Server Error" });
    }
});


router.get('/add', verifyToken, checkAdmin, async (req, res) => {
    try{
        res.status(200).json({ success: true, message: "Render add blogger form"});
    }catch(error){
        console.error("Error while adding blogger list:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/blogger/add', verifyToken, async (req, res) => {
    try {
        debugger;
        // Extract data from request body
        const { name, dob, gender, address, email, username, password } = req.body;
        const hashPassword = bcrypt.hashSync(password, salt);

        // Check if image is provided
        // if (!req.file) {
        //     return res.status(400).json({ success: false, error: "Image is required" });
        // }

        // Read image data from file
        //const imageData = fs.createReadStream(req.file.path);

        // Check if user with provided email already exists
        const availableUser = await AccountModel.findOne({ email: email });
        if (availableUser) {
            return res.status(500).json({ success: false, error: "User existed" });
        }

        // Create new account for the blogger
        const account = await AccountModel.create({
            email: email,
            username: username,
            password: hashPassword,
            role: 'blogger' // Specify the role for the account
        });
        console.log('account oke');
        // Create new blogger with the provided data
        const newBlogger = await BloggerModel.create({
            name: name,
            dob: dob,
            gender: gender,
            address: address,
           // image: imageData,
            account: account._id // Associate the blogger with the created account
        });
        console.log('newBlogger oke');
        // Check if the blogger was successfully created
        if (newBlogger) {
            return res.status(201).json({ success: true, message: "Blogger created successfully" });
        } else {
            return res.status(500).json({ success: false, message: "Error creating blogger" });
        }
    } catch (err) {
        // Handle validation errors
        if (err.name === 'ValidationError') {
            let InputErrors = {};
            for (let field in err.errors) {
                InputErrors[field] = err.errors[field].message;
            }
            console.error("Error while adding blogger:", err);
            return res.status(500).json({ success: false, error: "Internal Server Error", InputErrors });
        } else {
            console.error("Unexpected error while adding blogger:", err);
            return res.status(500).json({ success: false, error: "Unexpected error occurred" });
        }
    }
});

router.delete('/blogger/delete/:id', verifyToken, checkAdmin, async (req, res) => {
    try {
        const bloggerId = req.params.id;
        const Blogger = await BloggerModel.findById(bloggerId);
        const deleteAccount = await AccountModel.findByIdAndDelete(Blogger.account);
        const deletedBlogger = await BloggerModel.deleteById(bloggerId);
        if (!deletedBlogger) {
            res.status(404).json({ success: false, error: "category not found" });
            return;
        }
        if (!deleteAccount) {
            res.status(404).json({ success: false, error: "account not found" });
            return;
        }
        res.status(200).json({ success: true, message: "blogger deleted successfully" });
    } catch (error) {
        console.error("Error while deleting category:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

//---------------------------------------------------------------------------
//edit admin
// Render form for editing a specific admin
router.get('/edit/:id', verifyToken, checkAdmin, async (req, res) => {
    try {
        // Fetch admin details by ID
        const bloggerId = req.params.id;
        const blogger = await BloggerModel.findById(bloggerId);
        if (!blogger) {
            throw new Error('Blogger not found');
        }

        // Fetch account details by ID
        const accountId = blogger.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }

        res.json(blogger, account);

    } catch (error) {
        // Handle errors (e.g., admin not found)
        console.error(error);
        res.status(404).json({ success: false, error: "Blogger not found" });
    }
});

// Handle form submission for editing an admin
router.post('/blogger/edit/:id', verifyToken, checkAdmin, async (req, res) => {
    // , upload.single('image')
    try {
        // Fetch admin by ID
        const bloggerId = req.params.id;
        const blogger = await BloggerModel.findById(bloggerId);
        if (!blogger) {
            throw new Error('Blogger not found');
        }
        // Fetch user details by ID
        const accountId = blogger.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }

        // Update admin details
        blogger.name = req.body.name;
        blogger.dob = req.body.dob;
        blogger.gender = req.body.gender;
        blogger.address = req.body.address;
        // If a new image is uploaded, update it
        // if (req.file) {
        //     const imageData = fs.createReadStream(req.file.path);
        //     blogger.image = imageData;
        // }
        await blogger.save();

        account.email = req.body.email;
        account.username = req.body.username;
        account.password = bcrypt.hashSync(req.body.password, salt);
        await account.save();

        // Send success JSON response
        res.json({ success: true, message: "Blogger updated successfully" });
    } catch (err) {
        // Handle validation errors
        if (err.name === 'ValidationError') {
            let InputErrors = {};
            for (let field in err.errors) {
                InputErrors[field] = err.errors[field].message;
            }
            res.json({ success: false, error: "Validation Error", InputErrors });
        } else {
            // Handle other errors
            console.error("Error while updating blogger:", err);
            res.json({ success: false, error: "Internal Server Error" });
        }
    }
});

router.get('/blogger/profile', verifyToken, checkBlogger, async (req, res) => {
    try{
        var accountId = req.accountId;
        var AccountData = await AccountModel.findById(accountId._id);
      if(AccountData){
        var bloggerData = await BloggerModel.find({account: accountId});
      } else {
        res.status(500).json({ success: false, error: "Profile not found" });
      }
      res.status(200).json({ success: true, message: "Render edit blogger form", AccountData, bloggerData });
    }catch(error){
        console.error("Error while fetching Blogger:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/editBlogger/:id', verifyToken, checkBlogger, async (req, res) => {
    const bloggerId = req.params.id;
    const blogger = await BloggerModel.findById(bloggerId);
    if (!blogger) {
        res.status(404).json({ success: false, error: "Blogger not found" });
        return;
    }
    // Fetch user details by ID
    const accountId = blogger.account;
    const account = await AccountModel.findById(accountId);
    if (!account) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
    }
    try {
        res.status(200).json({ success: true, message: "Render add blogger form", blogger, account });
    } catch (error) {
        console.error(error);
        res.status(404).send('Blogger not found');
    }
    
});

router.post('/editBlogger/:id', verifyToken, checkBlogger, upload.single('image'), async (req, res) => {
    const bloggerId = req.params.id;
    const blogger = await BloggerModel.findById(bloggerId);
    if (!blogger) {
        res.status(404).json({ success: false, error: "Blogger not found" });
        return;
    }
    // Fetch user details by ID
    const accountId = blogger.account;
    const account = await AccountModel.findById(accountId);
    if (!account) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
    }
    try {
        // Update marketingmanager details
        blogger.name = req.body.name;
        blogger.dob = req.body.dob;
        blogger.gender = req.body.gender;
        blogger.address = req.body.address;
        // If a new image is uploaded, update it
        if (req.file) {
            const imageData = fs.createReadStream(req.file.path);
            blogger.image = imageData;
        } 
        await blogger.save();
        
        account.username = req.body.username;
        account.password = bcrypt.hashSync(req.body.password, salt);
        await account.save();

        res.status(200).json({ success: true, message: "Update my Blogger data success" });
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           console.error("Error while updating blogger:", err);
            res.status(500).json({ success: false, err: "Internal Server Error", InputErrors });
        }
     }
});

module.exports = router;
