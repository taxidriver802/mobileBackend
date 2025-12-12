import jwt from 'jsonwebtoken';

export default function socketAuth(socket, next) {
  try {
    // Prefer auth payload: io(url, { auth: { token } })
    let token = socket.handshake.auth?.token;

    // Fallback: allow "Authorization: Bearer <token>" style in handshake headers
    if (!token) {
      const header = socket.handshake.headers?.authorization;
      if (header?.startsWith('Bearer ')) token = header.split(' ')[1];
    }

    if (!token) return next(new Error('Unauthorized'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Keep it consistent with req.user in REST
    socket.user = decoded;
    socket.userId = decoded.id || decoded.userId || decoded._id; // adjust to match your JWT payload
    if (!socket.userId) return next(new Error('Invalid token payload'));

    return next();
  } catch (e) {
    return next(new Error('Invalid token'));
  }
}
