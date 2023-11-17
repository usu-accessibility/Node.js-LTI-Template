async function authorize(){
  if (!req.session.at_admin) {
    return res.status(403).json({ error: "you don't have permission to access this resource" });
  }
};

module.exports = {
  authorize
};
