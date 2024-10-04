import nodemailer from 'nodemailer';

const transport = await nodemailer.createTransport({
    service: "gmail",
    secure:true,
    port: 465,
    auth: {
      user: "bhushan9601@gmail.com",
      pass: "ftub cvdt bfet wgtq",
    },
  });


export default transport;