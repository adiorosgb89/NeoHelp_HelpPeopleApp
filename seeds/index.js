
const mongoose = require('mongoose');
const nevoiasi = require('./nevoiasi');
const Nevoias = require('../models/nevoiasi');


mongoose.connect('mongodb://localhost:27017/licenta', {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Database connected');
});

const seedDB = async()=>{
    await Nevoias.deleteMany({});
    for(let nevoias of nevoiasi){
        const c = new Nevoias(nevoias);
        await c.save();
    }
        
    
    
}

seedDB();