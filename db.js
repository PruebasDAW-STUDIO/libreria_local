var mongoose = require("mongoose");

if (process.env.NODE_ENV === 'production'){
        var mongoDB = process.env.MONGODB_URI_PROD;
}else{
        var mongoDB = process.env.MONGODB_URI_DEV;

}



//var db = mongoose.connection;

const dbConnection = async() => {

        await mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology:true});


}
dbConnection();
/*db.on('error', console.error.bind(console, 'Fallo conexion BD!!'));
db.once('open', ()=>{

        console.log("Conectado");
});*/