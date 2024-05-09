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

const { checkAdmin, verifyToken } = require('../middlewares/auth');
const RoleModel = require('../models/Role');




//---------------------------Phần này cho Admin---------------------------------------------
//show all 
router.get('/',checkAdmin ,verifyToken ,async(req, res) => {
    try{
        var roleList = await RoleModel.find({});
        res.status(200).json({ success: true, data: roleList });
    }catch(error){
        console.error("Error while fetching category list:", error);
        res.status(500).send("Internal Server Error");
    }
});

//-----------------------------------------------------------------------
//delete specific 
router.delete('/delete/:id', verifyToken, checkAdmin, async (req, res) => {
    try {
        const roleId = req.params.id;
        const deletedRole = await RoleModel.findByIdAndDelete(roleId);
        if (!deletedRole) {
            res.status(404).json({ success: false, error: "category not found" });
            return;
        }
        res.status(200).json({ success: true, message: "category deleted successfully" });
    } catch (error) {
        console.error("Error while deleting category:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

//------------------------------------------------------------------------
//create 
//receive form data and insert it to database
router.post('/add', verifyToken, checkAdmin, async (req, res) => {
    //get value by form : req.body
    try{
        var role = req.body;
        const newRole = await RoleModel.create(role);
        if(!newRole){
            res.status(400).json({ success: false, message: "Error in create Faculty" });
        } else {
            res.status(201).json({ success: true, message: "Faculty is created successfully" });
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
            console.error("Error while adding faculty:", error);
            res.status(500).json({ success: false, error: "Internal Server Error", InputErrors });
        }
     }
});

//---------------------------------------------------------------------------
//edit 
router.get('/edit/:id', verifyToken, checkAdmin, async (req, res) => {
    try{
        var id = req.params.id;
        var role = await RoleModel.findById(id);
        res.status(200).json({ success: true, message: "Render edit category form", data: role });
    }catch(error){
        console.error("Error while editing category:", error);
        res.status(500).send("Internal Server Error");
    }
    
});

router.post('/edit/:id', verifyToken, checkAdmin, async(req, res) => {
    try{
        var id = req.params.id;
        var data = req.body;
        const updateRole = await RoleModel.findByIdAndUpdate(id, data);
        if(updateRole){
            res.status(200).json({ success: true, message: "Faculty updated successfully" });
        }
    } catch (error) {
        if (error.name === 'ValidationError') {
           let InputErrors = {};
           for (let field in error.errors) {
              InputErrors[field] = error.errors[field].message;
           }
            console.error("Error while updating faculty:", error);
            res.status(500).json({ success: false, error: "Internal Server Error", InputErrors });
        }
     }
});

module.exports = router;