import nodemailer from 'nodemailer';
import {config} from 'dotenv';

config({ path:'./config/config.env' });
console.log(process.env.NODEMAILER_SERVICE,"this is service");
// process.env.NODEMAILER_SENDING_EMAIL_ADDRESS
const transport = await nodemailer.createTransport({
    // service: "gmail",
    service: process.env.NODEMAILER_SERVICE,
    secure:true,
    port: 465,
    auth: {
      // user: "bhushan9601@gmail.com",
      user: process.env.NODEMAILER_SENDING_EMAIL_ADDRESS,
      // pass: "fooe ehew mhzs alnd",
      pass:  process.env.NODEMAILER_SENDING_EMAIL_PASSWORD,
    },
  });

export default transport;