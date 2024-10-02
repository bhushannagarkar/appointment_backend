
import mongoose  from "mongoose";

const appointmentSchema=new mongoose.Schema({

    userEmail:{
        type:String,
        required:true,
    },
    userName:{
        type:String,
        required:true,
    },
    doctorEmail:{
        type:String,
        required:true,
    },
    slotDate:{
        type:String,
        required:true
    },
    slotTime:{
        type:String,
        required:true
    },
    whatsAppNumber:{
         type:String,
         required:true
    },
    // userData: { type: Object, required: true },
    doctorData: { type: Object, required: true },
    date: { type: Number, required: true },
    cancelled: { type: Boolean, default: false },
    isCompleted: { type: Boolean, default: false }
},
{
    timestamps: true,
});
const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema);
export default appointmentModel