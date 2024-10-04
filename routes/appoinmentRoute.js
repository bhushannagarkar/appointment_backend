import express from 'express';
import { bookAppointment, cancelAppointment, rescheduleAppointment ,switchDoctorAppointment} from '../controllers/appointmentController.js';
const appointmentRouter=express.Router();

appointmentRouter.post("/book-appointment",bookAppointment);
appointmentRouter.post("/cancel-appointment",cancelAppointment);
appointmentRouter.post("/reschedule-appointment",rescheduleAppointment);
appointmentRouter.post("/switch-doctor",switchDoctorAppointment);


export default appointmentRouter;