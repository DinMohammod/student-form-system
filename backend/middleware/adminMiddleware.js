// ==========================================
// Admin Middleware — শুধু Admin Role হলেই এগোতে দেবে
// ==========================================
// এটা authMiddleware (verifyToken) এর *পরে* ব্যবহার হবে,
// তাই req.user ইতিমধ্যে থাকবে (verifyToken সেট করে দিয়েছে)
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access Denied — Admin Only' });
    }
    next();
};

module.exports = { isAdmin };