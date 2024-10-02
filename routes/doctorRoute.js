import express from 'express';
import { loginDoctor, logOutDoctor } from '../controllers/doctorController.js';

const doctorRouter=express.Router();

doctorRouter.post("/login",loginDoctor);

doctorRouter.post("/logout",logOutDoctor);
export default doctorRouter;