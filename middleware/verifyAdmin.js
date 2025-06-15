export const verifyAdmin = (req, res, next) => {
  const userRole = req.headers["x-user-role"];
  if (!userRole) return res.status(401).json({ message: "Missing user Role" });

  if (userRole !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};
