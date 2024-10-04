import { appointmentSchema, cancelAppointmentSchema, rescheduleAppointmentSchema, switchDoctorAppointmentSchema } from "../middleware/validator.js";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";


const bookAppointment=async (req,res)=>{
    try{
        const { 
        userEmail,
        doctorEmail,
        slotDate,
        slotTime,
        whatsAppNumber,
        userName,
    }=req.body;


        
    const {error,value}=appointmentSchema.validate({
        userEmail,
        doctorEmail,
        slotDate,
        slotTime,
        whatsAppNumber,
        userName,
    });

    if(error){
      return res
      .status(401)
      .json({success:false,message:error.details[0].message});
    }


    const doctorData=await doctorModel.findOne({email:doctorEmail}).select("-password");
    // console.log(doctorData,'this is doctor data');

     if(!doctorData){
        return res
        .status(401)
        .json({success:false,message:'this doctor email is not registered by admin!'});   
     }

     if(!doctorData.available){
        return res
        .status(401)
        .json({success:false,message:'Doctor Not Available!'});   
     }
   
     let slots_booked=doctorData.slots_booked;

     //cheking for slot availability
     if(slots_booked[slotDate]){
        if(slots_booked[slotDate].includes(slotTime)){
        
            return res
        .status(401)
        .json({success:false,message:'Slot Not Available!'});   
        }

        else{
            slots_booked[slotDate].push(slotTime);
        }
     }else{
        slots_booked[slotDate]=[];
        slots_booked[slotDate].push(slotTime);
     }

     delete await doctorData.slots_booked;

     const appointmentData={
        userEmail,
        userName,
        doctorEmail,
        slotDate,
        slotTime,
        whatsAppNumber,
        doctorData,
        date: Date.now()
     }

     const newAppointment=new appointmentModel(appointmentData);
     await newAppointment.save();
    //  const email=doctorEmail;
    await doctorModel.findOneAndUpdate({email:doctorData.email},{slots_booked })
    
     return res
    .status(401)
    .json({success:false,message:'Appointment Booked'}); 

    }catch(error){
        console.log(error);
        res.json({success:false,message:`Error in Booking Appointment bhusahn ${error}`});
    }
}

const cancelAppointment = async (req, res) => {
    try {
        const { userEmail, doctorEmail, slotDate, slotTime } = req.body;
        const {error,value}=cancelAppointmentSchema.validate({
            userEmail, doctorEmail, slotDate, slotTime 
        });
    
        if(error){
          return res
          .status(401)
          .json({success:false,message:error.details[0].message});
        }

        
        // Find the appointment that matches the user, doctor, and slot details
        const appointment = await appointmentModel.findOne({
            userEmail,
            doctorEmail,
            slotDate,
            slotTime,
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        // Check if the appointment is already cancelled
        if (appointment.cancelled) {
            return res.status(400).json({ success: false, message: 'Appointment is already cancelled' });
        }

        // Check if the cancellation is within the restricted 6-hour window
        const now = new Date();
        const appointmentDate = new Date(`${slotDate}T${slotTime}`);
        const hoursDifference = (appointmentDate - now) / (1000 * 60 * 60);

        if (hoursDifference < 6) {
            return res.status(400).json({ success: false, message: 'Appointment cannot be cancelled within 6 hours of the scheduled time' });
        }

        // Mark the appointment as cancelled
        appointment.cancelled = true;
        await appointment.save();

        // Free up the slot in doctor's schedule
        const doctorData = await doctorModel.findOne({ email: doctorEmail });
        if (!doctorData) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        let slots_booked = doctorData.slots_booked;
        if (slots_booked[slotDate]) {
            slots_booked[slotDate] = slots_booked[slotDate].filter(time => time !== slotTime);
        }

        await doctorModel.findOneAndUpdate(
            { email: doctorEmail },
            { slots_booked }
        );

        return res.status(200).json({ success: true, message: 'Appointment cancelled successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: `Error in cancelling appointment: ${error.message}` });
    }
};

const rescheduleAppointment = async (req, res) => {
    try {
        const { userEmail, doctorEmail, oldSlotDate, oldSlotTime, newSlotDate, newSlotTime } = req.body;

        const {error,value}=rescheduleAppointmentSchema.validate({
            userEmail, doctorEmail, oldSlotDate, oldSlotTime, newSlotDate, newSlotTime
        });
    
        if(error){
          return res
          .status(401)
          .json({success:false,message:error.details[0].message});
        }

        // Find the existing appointment by the current date, time, and doctor info
        const appointment = await appointmentModel.findOne({
            userEmail,
            doctorEmail,
            slotDate: oldSlotDate,
            slotTime: oldSlotTime,
            cancelled: false,
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found or already cancelled' });
        }

        // Check if the appointment has already been rescheduled
        if (appointment.rescheduled) {
            return res.status(400).json({ success: false, message: 'Appointment has already been rescheduled once' });
        }

        // Find the doctor data
        const doctorData = await doctorModel.findOne({ email: doctorEmail });
        if (!doctorData) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        // Check if the new slot is available
        let slots_booked = doctorData.slots_booked;

        if (slots_booked[newSlotDate] && slots_booked[newSlotDate].includes(newSlotTime)) {
            return res.status(400).json({ success: false, message: 'The new slot is not available' });
        }

        // Free up the old slot
        if (slots_booked[oldSlotDate]) {
            slots_booked[oldSlotDate] = slots_booked[oldSlotDate].filter(time => time !== oldSlotTime);
        }

        // Book the new slot
        if (!slots_booked[newSlotDate]) {
            slots_booked[newSlotDate] = [];
        }
        slots_booked[newSlotDate].push(newSlotTime);

        // Update the doctor model with the new slots booked
        await doctorModel.findOneAndUpdate(
            { email: doctorEmail },
            { slots_booked }
        );

        // Update the appointment details with the new slot and mark as rescheduled
        appointment.slotDate = newSlotDate;
        appointment.slotTime = newSlotTime;
        appointment.rescheduled = true;
        appointment.rescheduledAt = new Date(); // Store when the reschedule occurred
        await appointment.save();

        return res.status(200).json({ success: true, message: 'Appointment rescheduled successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: `Error in rescheduling appointment: ${error.message}` });
    }
};

const switchDoctorAppointment = async (req, res) => {
    try {
        const { userEmail, oldDoctorEmail, newDoctorEmail, slotDate, slotTime } = req.body;
        // Validate the input data
        const { error, value } = switchDoctorAppointmentSchema.validate({
            userEmail, oldDoctorEmail, newDoctorEmail, slotDate, slotTime
        });

        console.log(userEmail, oldDoctorEmail, newDoctorEmail, slotDate, slotTime );
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }

        // Find the existing appointment with the old doctor
        const appointment = await appointmentModel.findOne({
            userEmail,
            doctorEmail: oldDoctorEmail,
            slotDate,
            slotTime,
            cancelled: false,
        });

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found or already cancelled' });
        }

        // Find the old doctor data
        const oldDoctorData = await doctorModel.findOne({ email: oldDoctorEmail });
        if (!oldDoctorData) {
            return res.status(404).json({ success: false, message: 'Old doctor not found' });
        }

        // Free up the old doctor's slot
        let oldDoctorSlotsBooked = oldDoctorData.slots_booked;
        if (oldDoctorSlotsBooked[slotDate]) {
            oldDoctorSlotsBooked[slotDate] = oldDoctorSlotsBooked[slotDate].filter(time => time !== slotTime);
        }

        // Update the old doctor's schedule
        await doctorModel.findOneAndUpdate({ email: oldDoctorEmail }, { slots_booked: oldDoctorSlotsBooked });

        // Find the new doctor data
        const newDoctorData = await doctorModel.findOne({ email: newDoctorEmail });
        if (!newDoctorData) {
            return res.status(404).json({ success: false, message: 'New doctor not found' });
        }

        // Check if the new doctor has availability in the same slot
        let newDoctorSlotsBooked = newDoctorData.slots_booked;
        if (newDoctorSlotsBooked[slotDate] && newDoctorSlotsBooked[slotDate].includes(slotTime)) {
            return res.status(400).json({ success: false, message: 'The new doctor is not available at the requested time' });
        }

        // Book the slot with the new doctor
        if (!newDoctorSlotsBooked[slotDate]) {
            newDoctorSlotsBooked[slotDate] = [];
        }
        newDoctorSlotsBooked[slotDate].push(slotTime);

        // Update the new doctor's schedule
        await doctorModel.findOneAndUpdate({ email: newDoctorEmail }, { slots_booked: newDoctorSlotsBooked });

        // Update the appointment details to switch to the new doctor
        appointment.doctorEmail = newDoctorEmail;
        appointment.doctorData = newDoctorData;  // Update the new doctor's details in the appointment
        await appointment.save();

        return res.status(200).json({ success: true, message: 'Doctor switched and appointment updated successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: `Error in switching doctor: ${error.message}` });
    }
};


export {
    bookAppointment,
    cancelAppointment,
    rescheduleAppointment,
    switchDoctorAppointment,
}

