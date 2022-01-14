var mongoose = require("mongoose");

var mongoDB = process.env.MONGODB_URI_PROD;

mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology:true});

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'Fallo conexion BD!!'));
db.once('open', ()=>{

        console.log("Conectado");
});