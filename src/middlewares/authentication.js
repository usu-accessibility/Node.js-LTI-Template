async function authorize(res, session){
  if (session.at_admin) {
    return true
  }
  else{
    return false;
  }
};

module.exports = {
  authorize
}