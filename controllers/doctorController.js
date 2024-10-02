import { loginSchema } from "../middleware/validator.js";
import doctorModel from "../models/doctorModel.js";
import jwt from "jsonwebtoken";
import { comparePassword } from "../utils/hashing.js";

const loginDoctor = async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;
    try {

        const { error, value } = loginSchema.validate({ email, password });

        if (error) {
            return res
                .status(401)
                .json({ success: false, message: error.details[0].message });
        }
        const existingDoctor = await doctorModel.findOne({ email }).select("+password");
        console.log(existingDoctor, 'this is existing');

        if (!existingDoctor) {
            return res
                .status(401)
                .json({ success: false, message: 'this email is not registerd!' })
        }

        const result = await comparePassword(password, existingDoctor.password);

        if (!result) {
            return res
                .status(401)
                .json({
                    success: false,
                    message: 'Invalid credentials!'
                });
        }


        const token = jwt.sign({
            adminId: existingDoctor._id,
            email: existingDoctor.email,
            verified: existingDoctor.verified,
        },
            process.env.TOKEN_SECRET,
            {
                expiresIn: process.env.TOKEN_EXPIRE,
            }

        );


        res.cookie('doctor', 'Bearer' + token, {
            expires: new Date(Date.now() + 8 * 3600000),
            httpOnly: process.env.NODE_ENV === 'production',
            secure: process.env.NODE_ENV === 'production',
        }).json({
            success: true,
            token,
            message: "logged in successfully doctor"
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "something went wrong in login doctor" });

    }
}


const logOutDoctor=async(req,res)=>{
    res.clearCookie('doctor')
    .status(200)
    .json({success:true,message:"doctor logged out successfully"
    });

 }
export {
    loginDoctor,
    logOutDoctor,
}