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

const GuestModel = require('../models/Guest');
const AccountModel = require('../models/Account');
const { verifyToken, checkAdmin, checkGuest } = require('../middlewares/auth');



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
// Route to get all admins
router.get('/guest', verifyToken, checkAdmin, async (req, res) => {
    try {
        res.json(await GuestModel.find().populate('account'));
    } catch (error) {
        console.error("Error while fetching guest list:", error);
        res.json({ success: false, error: "Internal Server Error" });
    }
});


// router.get('/add', verifyToken, checkAdmin, async (req, res) => {
//     try{
//         res.status(200).json({ success: true, message: "Render add guest form"});
//     }catch(error){
//         console.error("Error while adding Guest list:", error);
//         res.status(500).send("Internal Server Error");   
//     }
// });

router.post('/guest/add', verifyToken, checkAdmin, async (req, res) => {
    try {
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

        // Create new account for the guest
        const account = await AccountModel.create({
            email: email,
            username: username,
            password: hashPassword,
            role: 'guest' // Specify the role for the account
        });

        // Create new guest with the provided data
        const newGuest = await GuestModel.create({
            name: name,
            dob: dob,
            gender: gender,
            address: address,
            //image: imageData,
            account: account._id // Associate the guest with the created account
        });

        // Check if the guest was successfully created
        if (newGuest) {
            return res.status(201).json({ success: true, message: "Guest created successfully" });
        } else {
            return res.status(500).json({ success: false, message: "Error creating guest" });
        }
    } catch (err) {
        // Handle validation errors
        if (err.name === 'ValidationError') {
            let InputErrors = {};
            for (let field in err.errors) {
                InputErrors[field] = err.errors[field].message;
            }
            console.error("Error while adding guest:", err);
            return res.status(500).json({ success: false, error: "Internal Server Error", InputErrors });
        } else {
            console.error("Unexpected error while adding guest:", err);
            return res.status(500).json({ success: false, error: "Unexpected error occurred" });
        }
    }
});



router.delete('/guest/delete/:id', verifyToken, checkAdmin, async (req, res) => {
    try {
        const guestId = req.params.id;
        const Guest = await GuestModel.findById(guestId);
        const deleteAccount = await AccountModel.findByIdAndDelete(Guest.account);
        const deletedGuest = await GuestModel.findByIdAndDelete(guestId);
        if (!deleteAccount) {
            res.status(404).json({ success: false, error: "category not found" });
            return;
        }
        if (!deletedGuest) {
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
router.get('/guest/edit/:id', verifyToken, checkAdmin, async (req, res) => {
    try {
        // Fetch admin details by ID
        const guestId = req.params.id;
        const guest = await GuestModel.findById(guestId);
        if (!guest) {
            throw new Error('Blogger not found');
        }

        // Fetch user details by ID
        const accountId = guest.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            throw new Error('User not found');
        }

        res.json(guest, account);

    } catch (error) {
        // Handle errors (e.g., admin not found)
        console.error(error);
        res.json({ success: false, error: "Guest not found" });
    }
});

// Handle form submission for editing an admin
router.post('/guest/edit/:id', verifyToken, checkAdmin, async (req, res) => {
    try {
        // Fetch guest by ID
        const guestId = req.params.id;
        const guest = await GuestModel.findById(guestId);
        if (!guest) {
            throw new Error('Guest not found');
        }

        // Fetch account details by ID
        const accountId = guest.account;
        const account = await AccountModel.findById(accountId);
        if (!account) {
            throw new Error('Account not found');
        }

        // Update guest details
        guest.name = req.body.name;
        guest.dob = req.body.dob;
        guest.gender = req.body.gender;
        guest.address = req.body.address;
        // If a new image is uploaded, update it
        // if (req.file) {
        //     const imageData = fs.createReadStream(req.file.path);
        //     guest.image = imageData;
        // }
        await guest.save();

        // Update account details
        account.email = req.body.email;
        account.username = req.body.username;
        account.password = bcrypt.hashSync(req.body.password, salt);
        await account.save();

        // Send success JSON response
        res.json({ success: true, message: "Guest updated successfully" });
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
            console.error("Error while updating guest:", err);
            res.json({ success: false, error: "Internal Server Error" });
        }
    }
});


router.get('/guest/profile', verifyToken, checkGuest, async (req, res) => {
    try{
        var accountId = req.accountId;
        var AccountData = await AccountModel.findById(accountId._id);
      if(AccountData){
        var GuestData = await GuestModel.findById({account: accountId});
      } else {
        res.status(500).json({ success: false, error: "Profile not found" });
      }
      res.status(200).json({ success: true, message: "Render edit guest form", AccountData, GuestData });
    }catch(error){
        console.error("Error while fetching Guest:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/guest/editGuest/:id', verifyToken, checkGuest, async (req, res) => {
    const guestId = req.params.id;
    const guest = await GuestModel.findById(guestId);
    if (!guest) {
        res.status(404).json({ success: false, error: "Guest not found" });
        return;
    }
    // Fetch user details by ID
    const accountId = guest.account;
    const account = await UserModel.findById(accountId);
    if (!account) {
        res.status(404).json({ success: false, error: "Account+ not found" });
        return;
    }
    try {
        res.status(200).json({ success: true, message: "Render add guest form", guest, account });
    } catch (error) {
        console.error(error);
        res.status(404).send('Guest not found');
    }
    
});

router.post('/guest/editGuest/:id', verifyToken, checkGuest, upload.single('image'), async (req, res) => {
    const guestId = req.params.id;
    const guest = await GuestModel.findById(guestId);
    if (!guest) {
        res.status(404).json({ success: false, error: "Guest not found" });
        return;
    }
    // Fetch user details by ID
    const accountId = guest.account;
    const account = await AccountModel.findById(accountId);
    if (!account) {
        res.status(404).json({ success: false, error: "User not found" });
        return;
    }
    try {
        // Update marketingmanager details
        guest.name = req.body.name;
        guest.dob = req.body.dob;
        guest.gender = req.body.gender;
        guest.address = req.body.address;
        // If a new image is uploaded, update it
        if (req.file) {
            const imageData = fs.createReadStream(req.file.path);
            blogger.image = imageData;
        } 
        await guest.save();
        
        account.username = req.body.username;
        account.password = bcrypt.hashSync(req.body.password, salt);
        await account.save();

        res.status(200).json({ success: true, message: "Update my Guest data success" });
    } catch (err) {
        if (err.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in err.errors) {
              InputErrors[field] = err.errors[field].message;
           }
           console.error("Error while updating guest:", err);
            res.status(500).json({ success: false, err: "Internal Server Error", InputErrors });
        }
     }
});



module.exports = router;
