const express = require('express');
const router = express.Router();
const Category = require("../models/Category");
const Pin = require("../models/Pin");
const Package = require("../models/Package");
const { verifyToken, checkAdmin } = require("../middlewares/auth");
const main = require('../index');



//create a pin
router.post("/pinCreate",  verifyToken, async (req, res) => {
    debugger;
    try {
        const accountID = req.accountId;
        if(!accountID){
            return res.status(400).json({success: false, error: "Not found user"});
        } 
        const accountRole = accountID.role;
        const isAdmin = accountRole === "Admin";
        const newPinData = { ...req.body, pending: !isAdmin };
        const newPin = new Pin(newPinData);
        const savedPin = await newPin.save();
        if (!isAdmin) {
            main.io.emit('newPin', savedPin);
        }
        // if (!isAdmin) {
        //     const adminSockets = await main.io.adapter.sockets('admin-room'); // Join rooms for identification
        //     if (adminSockets.length > 0) {
        //         main.io.to('admin-room').emit('newPin', savedPin);
        //     } 
        // }
        res.status(200).json(savedPin);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/pins", async (req, res) => {
    try {
        const pins = await Pin.find({ pending: false });
        res.status(200).json(pins);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/pin/:id", async (req, res) => {
    try {
        const pinId = req.params.id;
        const pin = await Pin.findById(pinId);
        if (pin) {
            res.status(200).json(pin);
        } else {
            res.status(404).json({ success: false, error: "Pin not found" });
            return;
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/pins/pending", verifyToken, checkAdmin, async (req, res) => {
    try {
        const pendingPins = await Pin.find({ pending: true });
        res.status(200).json(pendingPins);
    } catch (err) {
        console.error("Error while fetching pins list:", error);
        res.json({ success: false, error: "Internal Server Error" });
    }
});

router.put('/pin/approve/:id', verifyToken, checkAdmin, async (req, res) => {
    try {
        const pinId = req.params.id;
        const pin = await Pin.findById(pinId);
        if (pin) {
            pin.pending = false; // Đánh dấu pin không còn ở trạng thái chờ nữa
            await pin.save();
            res.status(200).json({ success: true, message: "Pin approved successfully" });
        } else {
            res.status(404).json({ success: false, error: "Pin not found" });
            return;
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

router.delete('/pin/delete/:id', verifyToken, checkAdmin, async (req, res) => {
    try {
        const pin = req.params.id;
        const deletedPin = await Pin.findByIdAndDelete(pin);

        if (!deletedPin) {
            res.status(404).json({ success: false, error: "Pin not found" });
            return;
        }
        res.status(200).json({ success: true, message: "Pin deleted successfully" });
    } catch (error) {
        console.error("Error while deleting pin:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

router.get("/categories", async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/category/:id", async (req, res) => {
    try {
        const categoryId = req.params.id;
        const pinscategory = await Pin.find({ category: categoryId });
        res.status(200).json(pinscategory);
    } catch (err) {
        res.status(500).json(err);
    }
});

// Search pins by title
router.get("/search", async (req, res) => {
    try {
        const { title } = req.query; // Get the search term from the query parameter

        if (!title) {
            return res.status(400).json({ success: false, error: "Please provide a search term" });
        }

        // Search by title using regular expression for partial matches (optional)
        const searchRegex = new RegExp(title, 'i'); // 'i' flag for case-insensitive search

        const pins = await Pin.find({ title: searchRegex });

        res.status(200).json(pins);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.put('/pin/comment/:id', verifyToken, async (req, res) => {
    const accountId = req.accountId._id;
    const { comment } = req.body;
    const pinId = req.params.id;
    try {
        const pinComment = await Pin.findByIdAndUpdate(pinId, {
            $push: { comments: { text: comment, postedBy: accountId } }
        },
            { new: true }
        );
        const pin = await Pin.findById(pinComment._id).populate('comments.postedBy', 'username email');
        res.status(200).json({ success: true, pin });
    } catch (err) {
        res.status(500).json(err);
    }
});


router.get('/pin/select/:id', verifyToken, checkAdmin, async (req, res) => {
    try {
        const pinId = req.params.id;
        const pin = await Pin.findById(pinId);
        if (pin) {
            res.status(200).json({ success: true, pin });
        } else {
            res.status(404).json({ success: false, error: "Pin not found" });
            return;
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

router.put('/pin/select/:id', verifyToken, checkAdmin, async (req, res) => {
    try {
        const pinId = req.params.id;
        const pin = await Pin.findById(pinId);
        if (pin) {
            pin.choosen = req.body.choosen;
            await pin.save();
            res.status(200).json({ success: true, message: "Pin selected successfully" });
        } else {
            res.status(404).json({ success: false, error: "Pin not found" });
            return;
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

router.put('/pin/rate/:id', verifyToken, async (req, res) => {
    try {
        const pinId = req.params.id;
        const pin = await Pin.findById(pinId);

        const accountId = req.user._id;
        const existingRating = pin.ratings.find(rating => rating.postedBy.toString() === accountId);
        if (existingRating) {
            return res.status(400).json({ success: false, message: 'You have already rated on this pin.' });
        }

        const pinrate = req.body.rate;
        pin.totalrating = pin.totalrating + pinrate;
        pin.totalpeoplerating = pin.totalpeoplerating + 1;
        pin.averagerate = pin.totalrating / pin.totalpeoplerating;

        pin.ratings.push({ rate: pinrate, postedBy: accountId });

        await pin.save();
        res.json({ success: true, message: "Pin updated successfully" });
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/pin/package/:id", async (req, res) => {
    try {
        const pinId = req.params.id;
        const pin = await Pin.findById(pinId);
        const packages = await Package.find();

        const PackageId = req.body.selectedPackage;
        const selectedPackage = await Package.findById(PackageId);

        const addTime = selectedPackage.time;
        const timeToAddInMilliseconds = addTime * 60 * 60 * 1000;

        pin.time = new Date();
        pin.time = pin.time.getTime() + timeToAddInMilliseconds;

        await pin.save();

        res.status(200).json(packages);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/popular", async (req, res) => {
    try {
        const now = new Date();
        const pinData = await Pin.find({ time: { $gte: now } });
        if (pinData) {
            res.status(200).json({ success: true, pinData });
        } else {
            res.status(404).json({ success: false, error: "No popular pin" });
            return;
        }
    } catch (err) {
        res.status(500).json(err);
    }
});
module.exports = router;