import express from 'express';
import { bookAppointment } from '../controllers/appointmentController.js';
const appointmentRouter=express.Router();

appointmentRouter.post("/book-appointment",bookAppointment);

export default appointmentRouter;