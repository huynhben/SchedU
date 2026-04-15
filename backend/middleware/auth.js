const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided." });

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token." });
    req.user = { userID: payload.userID, isAdmin: payload.isAdmin };
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin)
    return res.status(403).json({ error: "Admin access required." });
  next();
}

module.exports = { authenticateToken, requireAdmin };
