const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const mongo = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
const app = express();

app.use(session({secret:'shh', saveUninitialized:false})); //initializam o sesiune
app.use(cookieParser())
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

var sess;

var url = "mongodb://localhost:27017/";


///-----HOME PAGE---///
app.get('/', (req, res) => {
	sess = req.session;
	sess.username; //variabila de sesiune
	console.log(sess.username);
	
	mongo.connect(url,{useUnifiedTopology:true},function(err,db){
		if(err)
		{
			console.log(err);
		}
		else{
			
			var dbo = db.db("cumparaturi");
			dbo.collection("produse").find().toArray(function(err,products){
				res.render('index',{user:sess.username, cookie: req.cookies.utilizator, items:products});
			});
			
			
		}
	});
	
	//res.render('index',{user:sess.username, cookie: req.cookies.utilizator});

	
});


///----AUTENTIFICARE SI VALIDARE----///

app.get('/autentificare',(req,res)=>{
	sess = req.session;
	res.render('autentificare',{eroare:req.cookies.mesajEroare, utilLogat:sess.username});
});


app.post('/verificare-autentificare',(req,res)=>{
	const username = req.body.username;
	const pass = req.body.pass;
	sess = req.session;
	fs.readFile("C:/Users/User/Desktop/proiect2-ana0998/utilizatori.json", (err, data)=>{
		if(err)
		{
			console.log(err);
		}
		const listaUtilizatori = JSON.parse(data);
		console.log(listaUtilizatori);
		var count=0;
		
		for(var i=0;i<listaUtilizatori.length;i++)
		{
			sess.incercariEsuate =  listaUtilizatori[i].incercariEsuate;
			if(listaUtilizatori[i].utilizator === username && listaUtilizatori[i].parola === pass)
			{
				count=1;
				sess.username = listaUtilizatori[i].utilizator;
				sess.numeUtilizator = listaUtilizatori[i].nume;
				sess.prenume = listaUtilizatori[i].prenume;
				sess.typeUser = listaUtilizatori[i].type;
				sess.incercariEsuate = listaUtilizatori[i].incercariEsuate;
				console.log(sess);
				console.log(sess.username);
				res.cookie("utilizator",req.body.username,{expires:new Date(Date.now()+ 1000)});
		
				res.redirect(302,'http://localhost:6789/');
		
				res.end();
			
			}
			
		}
		if(count ==0 )
		{

			res.cookie("mesajEroare","Date incorecte",{expires:new Date(Date.now()+ 1000)});
		
			res.redirect(302,'http://localhost:6789/autentificare');
		
			res.end();
		}
		
	});
	
});
//delogare folosind cookie
app.get('/logout',(req,res)=>{

	sess=req.session;
	res.cookie("utilizator","",{expires: new Date(Date.now()-1)});
	sess.username = undefined;
	res.redirect(302,"/");
});


//----CHESTIONAR---///
app.get('/chestionar', (req, res) => {
	fs.readFile("C:/Users/User/Desktop/proiect2-ana0998/intrebari.json",(err,data)=>{
		if(err)
		{
			console.log(err);
		}
		const listaIntrebari = JSON.parse(data);
		res.render('chestionar', {intrebari: listaIntrebari});
		
	});
	
	
	
});

///-----CALCUL RASPUNSURI CORECTE---//
app.post('/rezultat-chestionar', (req, res) => {
	
	var raspunsuriInput =req.body;
	console.log(raspunsuriInput);
	var count=0;
	fs.readFile("C:/Users/User/Desktop/proiect2-ana0998/intrebari.json",(err,data)=>{
		if(err)
		{
			console.log(err);
		}
		const listaIntrebari = JSON.parse(data);
		for(var i=0;i<listaIntrebari.length;i++)
		{
			if(raspunsuriInput["q"+i] === listaIntrebari[i].variante[listaIntrebari[i].corect])
			{
				count+=1;
			}
		}
		res.render('rezultat-chestionar',{answer:count});
		
	});
	

});


///--- CREARE BAZA DE DATE----///
app.get('/creare-bd',(req,res)=>{

	mongo.connect(url,function(err,db){
		if(err)
		{
			console.log(err);
		}
		else{
			var dbo = db.db("cumparaturi");
			dbo.createCollection("produse", function(err,res){
				if(err)
				{
					console.log(err);
				}
				else{
					console.log("Database and collection created");
					
				}
			});
		}
	});
	res.redirect('/');

});

//---INSERARE BAZA DE DATE---//
app.get('/inserare-bd',(req,res)=>{
	
	mongo.connect(url, function(err,db){

		if(err)
		{
			console.log(err);
		}
		else{
			var dbo = db.db("cumparaturi");
			var plus = {name:"Plus delfin", price:"30$", image:"/images/delfin.jpg"};
			var slime = {name:"Slime", price:"26$", image:"/images/Slime.jpg"};
			var car = {name:"Digital car", price:"50$",image:"/images/car.jpg"};
			var house = {name:"Dolls House", price:"100$", image:"/images/house.jpg"};
			var mickey = {name: "Mickey Mouse",price:"50$", image:"/images/mickey.jpg"};
			var products=[plus,slime,car,house,mickey];
			dbo.collection("produse").insertMany(products,function(err,result){
				if(err)
				{
					console.log(err);
				}
				else{
					console.log("Products are inserted");
					db.close();
				}
			})
		}
	});
	res.redirect("/");
});

//---ADAUGA PRODUSE IN COS---//
var prod=[];
app.post('/adaugare-cos',(req,res)=>{
	
	prod.push(req.body.id);
	sess=req.session;
	sess.produse = prod;
	console.log(sess);
});

//---COS DE CUMPARATURI---///
app.get('/vizualizare-cos',(req,res)=>{
	var produseAdaugate =sess.produse;
	var produse=[];
	var ids =[];
	produseAdaugate.forEach(element => {
		ids.push(ObjectId(element));
	});
	mongo.connect(url,{useUnifiedTopology:true},function(err,db){
		if(err)
		{
			console.log(err);
		}
		else{
			
			var dbo = db.db("cumparaturi");
			dbo.collection("produse").find({"_id": {$in: ids}}).toArray(function(err,products){
					res.render("vizualizare-cos.ejs",{productsSelected:products,user:sess.username});
				});
		}
	});
});

//--- LAB 13 PUNCTUL 1---//
app.get('/admin',(req,res)=>{
	
	sess = req.session;
	console.log(sess.typeUser);
	res.render('admin',{user:sess.username, typeUser:sess.typeUser});
});


app.post('/admin',(req,res)=>{

	const numeProdus=req.body.produsName;
	const price = req.body.produsPrice;
	const imageUrl = req.body.produsImage;
	console.log(numeProdus + " " + price + " "+ imageUrl);
	mongo.connect(url, function(err,db){

		if(err)
		{
			console.log(err);
		}
		else{
			var produs={name: numeProdus, price: price, image:imageUrl}
			var dbo = db.db("cumparaturi");
			dbo.collection("produse").insertOne(produs,function(err,result){
				if(err)
				{
					console.log(err);
				}
				else{
					console.log("Products are inserted");
					db.close();
				}
			})
		}
	});
	res.redirect("/");

});

app.listen(6789, () => console.log(`Serverul rulează la adresa http://localhost:`));