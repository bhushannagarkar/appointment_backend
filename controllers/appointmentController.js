import { appointmentSchema } from "../middleware/validator.js";
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

export {
    bookAppointment
}