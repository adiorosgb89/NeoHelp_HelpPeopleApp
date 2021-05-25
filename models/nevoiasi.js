const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const opts = {toJSON: {virtuals:true}};

const nevoiasiSchema = new Schema({
  nume: {
    type: String,
    required:true
  },
  poza: {
    url: String,
    filename: String

  },
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates:{
      type: [Number],
      required: true
    }
  },
  varsta: {
    type: String,
    required: true,
  },
  telefon: {
    type: String,
    required: true,
  },
  adresa: {
    type: String,
    required: true,
  },
  necesitati: {
    type: Array,
    required: true,
  },
  autor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  dataCreare: {
    type: String,
    
  }
}, opts);



nevoiasiSchema.virtual('properties.popText').get(function(){
  return `<img src="${this.poza.url}"><h6>${this.nume}</h6><h7>${this.varsta}</h7>`
})

const Nevoiasi = mongoose.model('Nevoiasi', nevoiasiSchema);

module.exports = Nevoiasi;
