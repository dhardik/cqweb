var express = require('express');
var path = require('path');
var port = 8000;
var app = express();
var fs = require('fs');
var ejs = require('ejs');
var session = require('express-session');
var multer = require('multer');
const bcrypt = require('bcrypt');
var ObjectId = require('mongodb').ObjectID;
var nodemailer = require('nodemailer');



app.set('views', path.join(__dirname,'views'));
app.set('view engine', 'ejs');

app.use(session({
	secret: "xYzUCAchitkara",
	resave: true,
	saveUninitialized: true
}));

//Connect with db
var mongoose = require('mongoose');
var mongoDB = 'mongodb://localhost/CQDB';

mongoose.connect(mongoDB);

mongoose.connection.on('error', (err) => {
    console.log('DB connection Error');
});

mongoose.connection.on('connected', (err) => {
    console.log('mongodb://localhost/mongoDB/CQDB DB connected !');
});

var Schema = mongoose.Schema;

//Defination of Schema
var userSchema = Schema({
  name : String,
  username : String,
  password : String,
  city : String,
  phoneno : String,
  gender : String,
  dob : String,
  role : String,
  status : String,
  pic_id : String,
  date_created : String,
  PI1 : String,
  PI2 : String,
  PI3 : String
});

var userDetails =  mongoose.model('userdetails', userSchema);

var tagSchema = Schema({
  tagname : String ,
  date_created : String ,
  createdby : String
});

var tagDetails = mongoose.model('tagdetails',tagSchema);

var communitySchema = Schema({
	name: String,
	membershipRule: String,
	location: String,
	owner: {UID:String,username:String,name:String,pic_id:String},
	createDate: String,
	activity: String,
	description: String,
	pic_id: String,
	members:[{UID:String,user:String,name:String,picID:String}],
	request:[{UID:String,user:String,name:String,picID:String}],
	admin:[{UID:String,user:String,name:String,picID:String}],
  invited:[{UID:String,user:String,name:String,picID:String}]
});

var communityDetails = mongoose.model('communitydetails',communitySchema);

// Access static files
app.use(express.static(path.join(__dirname,'public')));

// Parser of JSON and stores data to body in req
app.use(express.urlencoded({extended: true}));
app.use(express.json());

// Defining routes
var admin = require("./admin/admin");
var community = require("./community/community");

// setting middleware to admin.js
app.use('/admin',admin);
app.use('/community',community);

// multer
function sanitizeFile(file, cb) {
  let fileExts = ['png', 'jpg', 'jpeg', 'gif'];
  let isAllowedExt = fileExts.includes(file.originalname.split('.')[1].toLowerCase());
  let isAllowedMimeType = file.mimetype.startsWith("image/");
  if(isAllowedExt && isAllowedMimeType){
      return cb(null ,true);
  }
  else{
      cb('Error: File type not allowed!');
  }
}

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/image')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now()+ file.fieldname+'.'+file.originalname.split('.')[1].toLowerCase())
  }
});
 
var upload = multer({ storage: storage ,
  limits: {
      fileSize: 1000000
  },
  fileFilter: function (req, file, cb) {
      sanitizeFile(file, cb);
  }
}).single('profilePic');



app.post('/login',(req,res)=>{
  userDetails.find(req.body,function(err,data){
    if(err){
      throw err;
    }
    else{
      if(data.length == 0){
        res.send("Invalid username or password!!");
      }
      else{
        req.session.islogin = 1;
        req.session.username = data[0].username;
        req.session.role = data[0].role;
        req.session.pic_id = data[0].pic_id;
        req.session.name = data[0].name;
        req.session.UID = data[0]._id;
        res.send(data[0].role);
      }
    }
  })
});

app.post('/checkemail',function(req,res){
  userDetails.find(req.body,function(err,data){
    if(err){
      throw err;
    }
    else if(data.length != 0)
    {
      res.send("email already registered");
    }
    else if(data.length == 0)
    {
      res.send("Available");
    }
  })
})

app.get('/tag',function(req,res){
  if(req.session.islogin == 1){
    res.render('tag',{'info':req.session});
  }
  else{
    res.redirect('/');
  }
})

app.post('/addTag',function(req,res){
  tagDetails.find({'tagname' : req.body.tagname},function(err,data){
    if(err){
      throw err;
    }
    else{
      if(data.length != 0){
        res.send('Tag already exist !!');
      }
      else{
        var newTag = new tagDetails({
          tagname : req.body.tagname ,
          date_created : req.body.date_created ,
          createdby : req.session.username
        });

        newTag.save(function(err,data){
          if(err){
            throw err;
          }
          else{
            console.log(data);
            res.send('New tag created !!');
          }
        })
      }
    }
  })
})

app.get('/changePassword',function(req,res){
  if(req.session.islogin == 1){
    res.render('changePassword',{'info':req.session});
  }
  else{
    res.redirect('/');
  }
})

app.post('/changePassword',function(req,res){
  userDetails.find({'username':req.session.username},function(err,data){
    if(err){
      throw err;
    }
    else{
      if(data[0].password === req.body.oldpwd){
        userDetails.update({
          'username' : req.session.username
        },{
          $set: {
            'password' : req.body.newpwd
          }
        },function(err,data){
          res.send('Password changed successfully !!');
        })
      }
      else{
        res.send("Old password don't match !!");
      }
    }
  })
})

app.get('/logout',function(req,res){
  if(req.session.islogin == 1) {
    req.session.destroy();
    res.end();
  }
  else {
    res.redirect('/');
  }
})

app.get('/profile',function(req,res){
  if(req.session.islogin == 1){
    userDetails.find({username:req.session.username},function(err,info){
      if(err){
        throw err;
      }
      else{
        res.render('useradminprofile',{data:info});
      }
    })
  }
  else{
    res.redirect('/');
  }
})

app.get('/editprofile',function(req,res){
  if(req.session.islogin == 1){
    userDetails.find({
      username : req.session.username
    },function(err,info){
      if(err){
        throw err;
      }
      else{
        res.render('usereditprofile',{data:info});
      }
    });
  }
  else{
    res.redirect('/');
  }
})

app.post('/updateprofile',function(req,res){
  if(req.session.islogin == 1){
    upload(req,res,function(err){
      if(err){
        throw err;
      }
      else{
        if(req.file == undefined){
          res.send('No file selected!');
        }
        else{
          userDetails.updateOne({username:req.session.username},{$set:{
            name : req.body.name ,
            dob : req.body.date ,
            gender : req.body.gender ,
            phoneno : req.body.phone ,
            pic_id : req.file.filename , 
            city : req.body.city ,
            PI1 : req.session.PI1 ,
            PI2 : req.session.PI2 ,
            PI3 : req.session.PI3
          }},function(err,data){
            if(err){
              throw err;
            }
            else{
              req.session.pic_id = req.file.filename;
              res.redirect('/profile');
            }
          })
        }
      }
    })
  }
  else{
    res.redirect('/');
  }
})

app.get(['/tag/tagslist','/tagslist'],function(req,res) {
  if(req.session.islogin == 1) {
    tagDetails.find({},function(err,data){
      if(err) {
        throw err;
      }
      res.render(__dirname+'/views/taglist',{'info':req.session,'tag':data});
    })
  }
  else {
    res.redirect('/');
  }
})

app.delete('/deletetag',function(req,res) {
  if(req.session.islogin == 1) {
    tagDetails.deleteOne({'tagname':req.body.tagname},function(err,data){
      if(err) {
        throw err;
      }
      console.log(data);
      res.send();
    })
  }
  else {
    res.render('/');
  }
})

app.post('/communities',function(req,res) {
  console.log(req.body);
	var tCount,fCount;
	var size=parseInt(req.body.length);
	var start=parseInt(req.body.start);
	var serby=req.body.columns[parseInt(req.body.order[0].column)].name.toString();
	var ser=req.body.search.value;
	var sStatus=req.body.status;
	communityDetails.count({}).exec(function(err,totalCount)
	{
		if(err)
			res.send(err);
		tCount=totalCount;
	});
	var fin={name :new RegExp('^'+ser+'.*$', "i"),membershipRule : new RegExp('^'+sStatus+'.*$', "i")};
	communityDetails.count(fin).exec(function(err,totalCount)
	{
		if(err)
			res.send(err);
		fCount=totalCount;
	});
	if(serby=='name')
	{	
		var obj={'name':req.body.order[0].dir};
	}
	else if(serby=='location')
	{	
		var obj={'location':req.body.order[0].dir};
	}
	else if(serby=='owner')
	{	
		var obj={'owner.name':req.body.order[0].dir};
	}
	else
	{	
		var obj={'createDate':req.body.order[0].dir};
	}
	communityDetails.find(fin).skip(start).sort(obj).limit(size).exec(function(err,data){
		if(err)
		{
			res.send(err);
		}
		var totalPages=Math.ceil(fCount/size);
		res.send({pageLength:size,recordsTotal:tCount,recordsFiltered:fCount,data: data});
	});
})


app.post('/getComm',function(req,res){

  console.log(req.body);
  var fin={name :new RegExp('^'+req.body.search_value+'.*$', "i")};
	communityDetails.find({$and: [fin,{'owner.username':{$ne:req.session.username}},{'members.username':{$ne:req.session.username}},{'admin.username':{$ne:req.session.username}},{'request.username':{$ne:req.session.username}}]})
	.skip(req.body.skip).limit(req.body.limit).exec(function(err,data){
		if(err) 
			res.send(err);
		console.log(data);
		res.send(data);
	});

});

// Exporting models
module.exports = mongoose.model('userdetails', userSchema); 
module.exports = mongoose.model('tagdetails',tagSchema);
module.exports = mongoose.model('communitydetails',communitySchema);

app.listen(port,()=>{console.log(`Running localhost on ${port}`)});
