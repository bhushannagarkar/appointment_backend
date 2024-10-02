import jwt from 'jsonwebtoken';

const adminIdentifier=(req,res,next)=>{
    let token;
    if(req.headers.client=== 'not-browser'){
        token=req.headers.admin;
    }
    else{
        token=req.cookies['admin']
    }

    if(!token){
        return res.status(403).json({success:false,message:'Unauthorized Admin'});
    }

    try{
        const adminToken=token.split('')[1];
        const jwtVerified=jwt.verify(adminToken,process.env.TOKEN_SECRET);

        if(jwtVerified){
            req.admin=jwtVerified;
            next();
        }else{
            throw new Error('error in the token')
        }
    }catch(error){
        console.log(error);
        return res.status(404).json({success:false,message:"something went wrong in AdminIdentifier"})
    }
}

