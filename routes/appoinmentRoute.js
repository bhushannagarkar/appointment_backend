import express from 'express';
import { bookAppointment, cancelAppointment, rescheduleAppointment ,switchDoctorAppointment,getAllAppointmentsByEmail, getAllAppointmentsByEmailOnlyDiagnosis, addOnlineTestTransaction, sendQuetionpdf} from '../controllers/appointmentController.js';
import { upload } from '../middleware/multer.js';
const appointmentRouter=express.Router();

appointmentRouter.post("/book-appointment",bookAppointment);
appointmentRouter.post("/cancel-appointment",cancelAppointment);
appointmentRouter.post("/reschedule-appointment",rescheduleAppointment);
appointmentRouter.post("/switch-doctor",switchDoctorAppointment);

appointmentRouter.get('/appointments/:email', getAllAppointmentsByEmail);

appointmentRouter.get('/appointment/:email', getAllAppointmentsByEmailOnlyDiagnosis);


appointmentRouter.post('/appointment/tests', addOnlineTestTransaction );
appointmentRouter.post('/appointment/sendQuetionspdf',upload.single('pdf'), sendQuetionpdf );


export default appointmentRouter;