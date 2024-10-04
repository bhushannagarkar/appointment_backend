import express from 'express';
import { changeDoctorPassword, loginDoctor, logoutDoctor,  sendDoctorForgotPasswordCode, sendDoctorVerificationCode, updateDoctorProfile, verifyDoctorForgotPasswordCode, verifyDoctorVerificationCode } from '../controllers/doctorController.js';
import { doctorIdentifier } from '../middleware/adminIdentification.js';
import { upload } from '../middleware/multer.js';

const doctorRouter=express.Router();

doctorRouter.post("/login",loginDoctor);

doctorRouter.post("/logout",logoutDoctor);

doctorRouter.post("/update-profile", upload.single('image'),doctorIdentifier,updateDoctorProfile);
//sinding verifiaction code
doctorRouter.patch('/send-verification-code-for-doctor',doctorIdentifier,sendDoctorVerificationCode);
doctorRouter.patch('/verify-verification-code-for-doctor',doctorIdentifier,verifyDoctorVerificationCode);
//for changing the password of Admin
doctorRouter.patch('/change-password-for-doctor',doctorIdentifier,changeDoctorPassword);
//for forget password
doctorRouter.patch('/send-forgot-password-code-for-doctor',sendDoctorForgotPasswordCode)
doctorRouter.patch(
	'/verify-forgot-password-code-for-doctor',
	verifyDoctorForgotPasswordCode
);

export default doctorRouter;