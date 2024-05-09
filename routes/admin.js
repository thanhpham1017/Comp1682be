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

const AdminModel = require('../models/Admin');
const AccountModel = require('../models/Account');

const {checkAdmin, verifyToken} = require('../middlewares/auth');


const salt = bcrypt.genSaltSync(10);
const secret = 'bnxbcvxcnbvvcxvxcv';

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
// Route to get all admins
router.get('/admin', async (req, res) => {
    try {
        res.json(await AdminModel.find().populate('account'));
    } catch (error) {
        console.error("Error while fetching admin list:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});



// //---------------------------------------------------------------------------
// //edit admin
// // Render form for editing a specific admin
// router.get('/edit/:id',verifyToken , checkAdmin, async (req, res) => {
//     try {
//         // Fetch admin details by ID
//         const adminId = req.params.id;
//         const admin = await AdminModel.findById(adminId);
//         if (!admin) {
//             throw new Error('Admin not found');
//         }

//         // Fetch user details by ID
//         const accountId = admin.account;
//         const account = await AccountModel.findById(accountId);
//         if (!account) {
//             throw new Error('User not found');
//         }

//         res.json(admin, account);

//     } catch (error) {
//         // Handle errors (e.g., admin not found)
//         console.error(error);
//         res.status(404).json({ success: false, error: "Admin not found" });
//     }
// });

// // Handle form submission for editing an admin
// router.post('/edit/:id', verifyToken , checkAdmin, upload.single('image'), async (req, res) => {
//     try {
//         // Fetch admin by ID
//         const adminId = req.params.id;
//         const admin = await AdminModel.findById(adminId);
//         if (!admin) {
//             throw new Error('Admin not found');
//         }
//         // Fetch user details by ID
//         const accountId = admin.account;
//         const account = await UserModel.findById(accountId);
//         if (!account) {
//             throw new Error('User not found');
//         }

//         // Update admin details
//         admin.name = req.body.name;
//         admin.dob = req.body.dob;
//         admin.gender = req.body.gender;
//         admin.address = req.body.address;
//         // If a new image is uploaded, update it
//         if (req.file) {
//             const imageData = fs.createReadStream(req.file.path);
//             blogger.image = imageData;
//         }
//         await admin.save();

//         account.email = req.body.email;
//         account.password = bcrypt.hashSync(req.body.password, salt);
//         await account.save();

//         // Send success JSON response
//         res.json({ success: true, message: "Admin updated successfully" });
//     } catch (err) {
//         // Handle validation errors
//         if (err.name === 'ValidationError') {
//             let InputErrors = {};
//             for (let field in err.errors) {
//                 InputErrors[field] = err.errors[field].message;
//             }
//             res.json({ success: false, error: "Validation Error", InputErrors });
//         } else {
//             // Handle other errors
//             console.error("Error while updating admin:", err);
//             res.json({ success: false, error: "Internal Server Error" });
//         }
//     }
// });

router.get('/admin/profile', verifyToken , checkAdmin, async (req, res) => {
    try{
        var accountId = req.accountId;
        var AccountData = await AccountModel.findById(accountId._id);
      if(AccountData){
        var AdminData = await AdminModel.findById({account: accountId});
      } else {
        res.status(500).json({ success: false, error: "Profile not found" });
      }
      res.status(200).json({ success: true, message: "Render edit marketing manager form", AccountData, AdminData });
    }catch(error){
        console.error("Error while fetching Admin:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/admin/editAdmin/:id', verifyToken , checkAdmin, async (req, res) => {
    const adminId = req.params.id;
    const admin = await AdminModel.findById(adminId);
    if (!admin) {
        res.status(404).json({ success: false, error: "Admin not found" });
        return;
    }
    // Fetch user details by ID
    const accountId = admin.account;
    const account = await AccountModel.findById(accountId);
    if (!account) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
    }
    try {
        res.status(200).json({ success: true, message: "Render add marketing manager form", admin, account });
    } catch (error) {
        console.error(error);
        res.status(404).send('Admin not found');
    }
    
});

router.post('/admin/editAdmin/:id', verifyToken , checkAdmin, upload.single('image'), async (req, res) => {
    const adminId = req.params.id;
    const admin = await AdminModel.findById(adminId);
    if (!admin) {
        res.status(404).json({ success: false, error: "Admin not found" });
        return;
    }
    // Fetch user details by ID
    const accountId = admin.account;
    const account = await AccountModel.findById(accountId);
    if (!account) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
    }
    try {
        // Update marketingmanager details
        admin.name = req.body.name;
        admin.dob = req.body.dob;
        admin.gender = req.body.gender;
        admin.address = req.body.address;
        // If a new image is uploaded, update it
        if (req.file) {
            const imageData = fs.createReadStream(req.file.path);
            blogger.image = imageData;  
        } 
        await admin.save();
        
        account.username = req.body.username;
        account.password = bcrypt.hashSync(req.body.password, salt);
        await account.save();

        res.status(200).json({ success: true, message: "Update my Admin data success" });
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           console.error("Error while updating admin:", err);
            res.status(500).json({ success: false, err: "Internal Server Error", InputErrors });
        }
     }
   
});

module.exports = router;
