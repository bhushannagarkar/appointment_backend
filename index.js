import express from 'express'
import cors from'cors';
import cookieParser from'cookie-parser';
import {config} from 'dotenv';
import connectDB from './config/mongodb.js';
import adminRouter from './routes/adminRoute.js';
import doctorRouter from './routes/doctorRoute.js'
import connectCloudinary from './config/cloudinary.js';
import appointmentRouter from './routes/appoinmentRoute.js';


const app=express();
config({ path:'./config/config.env' });

connectDB();
connectCloudinary();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));


app.use("/api/admin",adminRouter);
app.use("/api/doctor",doctorRouter);
app.use("/api/appointment",appointmentRouter);

app.get("/", (req, res) => {
    res.json("API Working");
  });
  
app.listen(process.env.PORT,()=>{
    console.log(`listening... on port ${process.env.PORT}`);
})