var mongoose = require("mongoose");

var mongoDB = process.env.MONGODB_URI_PROD;


//var db = mongoose.connection;

const dbConnection = async() => {

        await mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology:true});


}
dbConnection();
/*db.on('error', console.error.bind(console, 'Fallo conexion BD!!'));
db.once('open', ()=>{

        console.log("Conectado");
});*/