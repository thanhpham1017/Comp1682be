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

const CategoryModel = require('../models/Category');
const { checkAdmin, verifyToken } = require('../middlewares/auth');




//---------------------------Phần này cho Admin---------------------------------------------
//show all 
router.get('/category',verifyToken  ,async(req, res) => {
    try{
        var categoryList = await CategoryModel.find({});
        res.status(200).json({ success: true, data: categoryList });
    }catch(error){
        console.error("Error while fetching category list:", error);
        res.status(500).send("Internal Server Error");
    }
});

//-----------------------------------------------------------------------
//delete specific 
router.delete('/category/delete/:id', verifyToken, checkAdmin, async (req, res) => {
    try {
        const categoryId = req.params.id;
        const deletedCategory = await CategoryModel.findByIdAndDelete(categoryId);
        if (!deletedCategory) {
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
router.post('/category/add', verifyToken, checkAdmin, async (req, res) => {
    //get value by form : req.body
    try{
        var category = req.body;
        const newCategory = await CategoryModel.create(category);
        if(!newCategory){
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
router.get('/category/edit/:id', verifyToken, checkAdmin, async (req, res) => {
    try{
        var id = req.params.id;
        var category = await CategoryModel.findById(id);
        res.status(200).json({ success: true, message: "Render edit category form", data: category });
    }catch(error){
        console.error("Error while editing category:", error);
        res.status(500).send("Internal Server Error");
    }
    
});

router.post('/category/edit/:id', verifyToken, checkAdmin, async (req, res) => {
    try {
        var id = req.params.id;
        var data = req.body;
        const updateCategory = await CategoryModel.findByIdAndUpdate(id, data, { new: true }); // Set { new: true } to return the updated document
        if (updateCategory) {
            res.status(200).json({ success: true, message: "Category updated successfully", data: updateCategory });
        } else {
            res.status(404).json({ success: false, error: "Category not found" });
        }
    } catch (error) {
        console.error("Error while updating category:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

module.exports = router;