import express from 'express';
import { registerAdmin,loginAdmin, logoutAdmin ,addDoctorByAdmin, getAllDoctors,sendVerificationCode,uploadAllDoctorByAdmin} from '../controllers/adminController.js';
// import upload from '../utils/multer.js';
import { upload } from '../middleware/multer.js';

const adminRouter=express.Router();

adminRouter.post("/register",registerAdmin);
adminRouter.post("/login",loginAdmin);
adminRouter.post("/logout",logoutAdmin);

//add doctor by admin
adminRouter.post("/add-doctor", upload.single('image'),addDoctorByAdmin);
//for uploading all doctor using csv file 
adminRouter.post("/upload-all-doctor", upload.single('excelFile'),uploadAllDoctorByAdmin);
adminRouter.get("/get-all-doctors",getAllDoctors);


//sinding verifiaction code
adminRouter.patch('/send-verification-code',sendVerificationCode)
export default adminRouter;