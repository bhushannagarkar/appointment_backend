import jwt from 'jsonwebtoken';

const adminIdentifier  = (req, res, next) => {
	
	let token;
	if (req.headers.client === 'not-browser') {
		token = req.headers.authorization;
	} else {
		token = req.cookies['Authorization'];
		// token = req.cookies['Admin'];
	}

	if (!token) {
		return res.status(403).json({ success: false, message: 'Unauthorized' });
	}

	try {
		const adminToken = token.split(' ')[1];
		const jwtVerified = jwt.verify(adminToken, process.env.TOKEN_SECRET);
		if (jwtVerified) {
			req.admin= jwtVerified;
			next();
		} else {
			throw new Error('error in the token');
		}
	} catch (error) {
		console.log(error);
		return res.status(403).json({ success: false, message: 'error occured in catch block invalid token' });
	}
};

const doctorIdentifier = (req, res, next) => {
	let token;
  
	// Determine the token source (header or cookie)
	if (req.headers.client === 'not-browser') {
	  // If it's not a browser, get token from headers
	  token = req.headers.authorization;
	} else {
	  // If it's a browser client, get the token from cookies
	  token = req.cookies['Authorization'];
	}
  
	// console.log("Cookies: Sushank", req.cookies);
	// console.log("Headers: Sushank", req.headers);
	// console.log("Authorization: Sushank", req.cookies.Authorization);


	// If no token is found, return unauthorized response
	if (!token) {
	  return res.status(403).json({ success: false, message: 'Unauthorized: No token provided' });
	}
  
	try {
	  // For header-based tokens, ensure it's in the "Bearer <token>" format
	  const doctorToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
  
	  // Verify the token using the secret
	  const jwtVerified = jwt.verify(doctorToken, process.env.TOKEN_SECRET);
  
	  if (jwtVerified) {
		req.doctor = jwtVerified; // Attach the verified token payload (doctor data) to the request
		next(); // Call the next middleware
	  } else {
		throw new Error('Token verification failed');
	  }
	} catch (error) {
	  console.error('Token error:', error.message);
	  return res.status(403).json({ success: false, message: 'Invalid or expired token' });
	}
  };
  


export{
    adminIdentifier,
	doctorIdentifier,
}