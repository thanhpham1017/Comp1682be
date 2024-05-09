const jwt = require('jsonwebtoken');
const AccountModel = require('../models/Account');

const verifyToken = (req, res, next) => {
   const token = req.cookies.token; 
   if (!token)
         return res
               .status(401)
               .json({ success: false, message: 'Access token not found' })

      try {
         const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) //verify: kiểm tra, cho 2 dữ liệu vào bao gồm token và khóa

         req.accountId = decoded.id 
         next()
      } catch (error) {
         console.log(error)
         return res.status(403).json({ success: false, message: 'Invalid token' })
      }
};


const checkAdmin = (req, res, next) => {
   const accountID = req.accountId;
   if(!accountID){
      return res.status(400).json({success: false, error: "Not found user"});
  }
  const accountRole = accountID.role;
  console.log(accountRole);
   if (accountRole === "Admin") {
      console.log("true");
      next();
   }
   else {
      console.log("false");
      res.status(500).json({success: false, error: "NOT PERMIT"});
      return;
   }
};


const checkBlogger = (req, res, next) => {
   const accountID = req.accountId;
   if(!accountID){
      return res.status(400).json({success: false, error: "Not found user"});
   }
   const accountRole = accountID.role;
   console.log(accountRole);
   if (accountRole === "Blogger") {
      next();
   }
   else {
      res.status(500).json({success: false, error: "NOT PERMIT"});
      return;
   }
};

const checkGuest = (req, res, next) => {
   const accountID = req.accountId;
   if(!accountID){
      return res.status(400).json({success: false, error: "Not found user"});
   }
   const accountRole = accountID.role;
   if (accountRole === "Guest" || accountRole === "Admin" || accountRole === "Blogger") {
      next();
   }
   else {
      return res.status(500).json({success: false, error: "NOT PERMIT"});
   }
};

//-------------
 module.exports = {
    checkAdmin,
    checkGuest,
    checkBlogger,
    verifyToken
 }
 
 