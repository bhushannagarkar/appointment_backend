import express from 'express';
import { registerAdmin,loginAdmin, logoutAdmin ,addDoctorByAdmin, getAllDoctors,sendVerificationCode,uploadAllDoctorByAdmin, verifyVerificationCode,changePassword, sendForgotPasswordCode,verifyForgotPasswordCode, getSingleDoctor, getAllAppointments, addOnlineTestByAdmin} from '../controllers/adminController.js';
// import upload from '../utils/multer.js';
import { upload } from '../middleware/multer.js';
import { adminIdentifier } from '../middleware/adminIdentification.js';

const adminRouter=express.Router();

adminRouter.post("/register",upload.single('adminImagelink'),registerAdmin);
adminRouter.post("/login",loginAdmin);
adminRouter.post("/logout",adminIdentifier,logoutAdmin);

//add doctor by admin
adminRouter.post("/add-doctor", upload.single('doctorImage'),addDoctorByAdmin);
//for uploading all doctor using csv file 
adminRouter.post("/upload-all-doctor", upload.single('excelFile'),uploadAllDoctorByAdmin);
adminRouter.get("/get-all-doctors",getAllDoctors);
adminRouter.get("/get-single-doctor/:id", getSingleDoctor);

//sinding verifiaction code
adminRouter.patch('/send-verification-code',adminIdentifier,sendVerificationCode);
adminRouter.patch('/verify-verification-code',adminIdentifier,verifyVerificationCode);
//for changing the password of Admin
adminRouter.patch('/change-password',adminIdentifier,changePassword);
//for forget password
adminRouter.patch('/send-forgot-password-code',sendForgotPasswordCode)
adminRouter.patch(
	'/verify-forgot-password-code',
	verifyForgotPasswordCode
);

adminRouter.get(
	'/get-all-appointments',
	getAllAppointments
);


adminRouter.post(
	'/add-online-test',
	addOnlineTestByAdmin
);

export default adminRouter;