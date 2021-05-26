if(process.env.NODE_ENV !== "production"){
  require('dotenv').config()
}

const express = require('express');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const multer = require('multer');
const {cloudinary, storage} = require('./cloudinary');
const upload = multer({storage});
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({accessToken: mapBoxToken});
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require("helmet");
const flash = require('connect-flash');
const {isLoggedIn,isAutor} = require('./middleware');

const Nevoias = require('./models/nevoiasi');
const User = require('./models/user');

const MongoDBStore = require('connect-mongo')(session);

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/licenta';
// 'mongodb://localhost:27017/licenta'
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Database connected');
});

const app = express();

// atribuie pachetul "ejsMate" motorului "ejs"
app.engine('ejs', ejsMate); 
// se seteaza motorul view ca fiind "ejs"
app.set('view engine', 'ejs');
// se seteaza calea de vedere a fisierului "views"
app.set('views', path.join(__dirname, 'views'));
// se converteste url-ul codificat al body-ului
app.use(express.urlencoded({ extended: true }));
// se seteaza calea de vedere a fisierului "public"
app.use(express.static(path.join(__dirname, 'public')));

app.use(methodOverride('_method'));
// security / verification
app.use(mongoSanitize());
app.use(helmet({contentSecurityPolicy: false}));

const secret = process.env.SECRET || 'aplicatiedenevoiasi'

const store = new MongoDBStore({
  url: dbUrl,
  secret,
  touchAfter: 24 * 60 * 60
});

store.on("error", function(e){
  console.log("SESSION STORE ERROR", e);
})

const sessionConfig = {
  store,
  name: 'session',
  secret,
  resave: false,
  saveUninitialized: true,
  cookie:{
    httpOnly: true,
    // secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use( (req,res,next)=>{
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentUser =  req.user;
  next()
})




app.get('/', (req, res) => {
  res.render('acasa',{
    page_name: 'acasa'
  });
});

app.get('/contact', (req, res) => {
  res.render('contact',{
    page_name: 'contact'
  });
});

app.post('/mesajcontact', (req, res)=>{
  req.flash('success','Mesajul s-a trimis cu succes!');
  res.redirect('/contact');
});

app.post('/abonare',(req,res)=>{
  req.flash('success','Te-ai abonat cu succes la noutăţi!');
  res.redirect('..')
});

app.get('/despre', (req, res) => {
  res.render('despre',{
    page_name: 'despre'
  });
});




 // SHOW NEVOIASI IN LISTA
app.get('/nevoiasi', async (req, res) => {
  
  const nevoiasi = await Nevoias.find({})

    
    res.render('nevoiasi',{
      page_name: 'nevoiasi',
      nevoiasi,
      
    });
  
  
 

});

// SHOW DATA OF SELECTED NEVOIAS 
app.get('/nevoiasi/:id', async (req, res) => {
    const nevoias = await Nevoias.findById(req.params.id).populate('autor');
    res.send(nevoias);
});

// CREATE NEVOIASI
app.post('/nevoiasi',isLoggedIn,(upload.single('nevoias[poza]')), async (req,res) =>{
const geoData = await geocoder.forwardGeocode({
  query: req.body.nevoias.adresa,
  limit:1
}).send()
const nevoias = new Nevoias(req.body.nevoias);
nevoias.geometry = geoData.body.features[0].geometry;

if(req.file){
nevoias.poza = {
  url: req.file.path,
  filename: req.file.filename
}
} else if(!req.file){
  nevoias.poza = {
    url: "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png",
    filename: "/NeoHelp/Portrait_Placehoder"
  }
}
const now = new Date().toJSON().slice(0,10).replace(/-/g,'/');
nevoias.dataCreare = now;
// nevoias.filename = req.file.filename;
nevoias.autor = req.user._id;
await nevoias.save();
req.flash('success','Ai creat un nevoiaş cu succes!')
res.redirect('/nevoiasi');
})

// GET USER&NEVOIAS ID
app.get('/profil',isLoggedIn, async (req, res) => {
  const nevoiasi = await Nevoias.find({})
  
  
  const currentUser =  req.user;
  
  // const user = await User.findById(currentUser._id)
   res.render('users/profil',{
    page_name: 'profil',
    nevoiasi,
    currentUser,
    // user
  });

});



// SHOW DATA OF SELECTED NEVOIAS IN EDIT FORM INPUTS
app.get('/profil/:id',isLoggedIn, async (req, res) => {
  // const currentUser = req.user;
  // const user = await User.findById(currentUser._id)
  // console.log(user);
   const nevoias = await Nevoias.findById(req.params.id)
   res.send( nevoias);
   
});

// SEND CURRENT USER TO JS REQUEST 
app.get('/user/:id',isLoggedIn, async (req, res) => {
  const currentUser = req.user;
  const user = await User.findById(currentUser._id)
  // console.log(user);
   // const nevoias = await Nevoias.findById(req.params.id)
   
   res.send(user);
   
});

// UPDATE USER INFO
app.put('/user/:id',isLoggedIn, async (req,res)=>{
  const currentUser =  req.user;
  
  const user = await User.findByIdAndUpdate(currentUser._id,{email:req.body.email, username:req.body.nume },{new:true});
  req.flash('success', 'Ai modificat datele contului cu succes!')
  res.redirect('/profil')
})

// ADD OR CHANGE USER PICTURE
app.put('/userpic/:id',isLoggedIn,(upload.single('poza')), async (req,res)=>{
  const currentUser =  req.user;
  
  const user = await User.findById(currentUser._id);
  const filename = user.poza.filename
  if(filename){
  
  await cloudinary.uploader.destroy(filename)
  }
  user.poza = {
    url: req.file.path,
    filename: req.file.filename
  }
  await user.save()
  req.flash('success', 'Ai modificat poza cu succes!')
  res.redirect('/profil')
})

// DELETE USER
app.delete('/profil/:id',isLoggedIn, async (req,res)=>{
    const currentUser = req.user;
    const nevoias = await Nevoias.find();
    for(nev of nevoias){
      if(nev.autor.equals(currentUser._id)){
        const filename = nev.poza.filename;
        cloudinary.uploader.destroy(filename);
        await Nevoias.findByIdAndDelete(nev._id)
      }
    }
    await User.findByIdAndDelete(currentUser._id)
    req.flash('success', 'Ai şters contul cu succes!')
    res.redirect('/');
})

// UPDATE NEVOIASI
app.put('/nevoiasi/:id/:modpoza',isLoggedIn,isAutor,(upload.single('nevoias[poza]')), async (req,res)=>{
  const {id} = req.params;
  const {modpoza} = req.params;
  const geoData = await geocoder.forwardGeocode({
    query: req.body.nevoias.adresa,
    limit:1
  }).send()
  const nevoias = await Nevoias.findByIdAndUpdate(id, {...req.body.nevoias},{new:true})
  nevoias.geometry = geoData.body.features[0].geometry;
  if(modpoza == 'true'){
    const filename = nevoias.poza.filename;
  cloudinary.uploader.destroy(filename)
  nevoias.poza = {
    url: req.file.path,
    filename: req.file.filename
  }
  }
  await nevoias.save();
  req.flash('success', 'Ai modificat nevoiaşul cu succes!')
  res.redirect('/nevoiasi')
})

// DELETE NEVOIASI
app.delete('/nevoiasi/:id',isLoggedIn,isAutor, async (req,res)=>{
  const {id} = req.params;
  const nevoias = await Nevoias.findById(id)
  const filename = nevoias.poza.filename;
  cloudinary.uploader.destroy(filename)
  await Nevoias.findByIdAndDelete(id)
  req.flash('success', 'Ai şters nevoiaşul cu succes!')
  res.redirect('/nevoiasi')
})


// REGISTER 
app.get('/register', (req, res) => {
  res.render('users/login');
});

// LOGIN DIRECTLY AFTER REGISTERING
app.post('/register', async (req, res, next) => {
try{
  const {email, username, password} = req.body;
  const user = new User({email, username});
  user.poza = {
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'
  }
  const registeredUser = await User.register(user, password);
  req.login(registeredUser, err => {
    if(err) return next(err);
    req.flash('success', 'Bun venit!')
    res.redirect('/');
  })
} catch(e) {
  req.flash('error', 'Ai introdus ceva greşit!')
  res.redirect('register')
}
});

// LOGIN
app.get('/login', (req, res) => {
  res.render('users/login');
});
app.post('/login', passport.authenticate('local', {failureFlash:true, failureRedirect: '/login'}), (req, res) => {
  req.flash('success', 'Bine ai revenit!')
  res.redirect('/');
});

app.get('/logout', (req,res)=>{
  req.logout();
  req.flash('success', 'Te-ai deconectat cu succes!')
  res.redirect('/')
})



app.get('/donare', (req, res) => {
  const currentUser =  req.user;
  res.render('users/donate', {currentUser});
});

app.post('/donated', (req, res) => {
  const currentUser =  req.user;
  res.render('redirect/donated', {currentUser});
});



app.listen(3000, () => {
  console.log('Serving on port 3000');
});
