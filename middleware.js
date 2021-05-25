const Nevoias = require('./models/nevoiasi');

// VERIFY IF USER IS LOGGED IN
module.exports.isLoggedIn = (req,res,next) =>{
if(!req.isAuthenticated()){
    return res.redirect('/login');
}
next();
}


// VERIFY IF THE USER IS THE CREATOR OF ANY OF NEVOIASI
module.exports.isAutor = async (req,res,next) =>{
    const {id} = req.params;
    const nevoias = await Nevoias.findById(id);
    if(!nevoias.autor.equals(req.user._id)){
      return res.redirect('/nevoiasi')
    }
    next();
  }