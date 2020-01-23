var express = require('express');
var path = require('path');
const router = express.Router();
var nodemailer = require('nodemailer');

// Access static files
router.use(express.static(path.join(__dirname,'../public')));

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userDetails = mongoose.model("userdetails");

function SendNodeMail(To,name,pass)
{
var transporter=nodemailer.createTransport({
	service:'gmail',
	secure:false,
	port:25,
	auth:{
		user:'togetherconnect0@gmail.com',
		pass:'connect123!'
	},
	tls:{
		rejectUnauthorized:false
	}
});

var mailOptions={
	from:'meetgreet12@gmail.com',
	to:To,
	subject:'Welcome to CQ',
	text:'Hi '+name+', You have been Successfully Registered to CQ\nPassword:'+pass
}
transporter.sendMail(mailOptions,function(err,info){
	if(err)
	{
		console.log(err);
		throw err;
	}
	else
		console.log('Email Sent'+info.resopnse);
});
}


router.get('/profile',function(req,res){
    if(req.session.islogin == 1)
    {
        userDetails.find({username : req.session.username},function(err,data){
            res.render(__dirname+'/views/homepage',{'info':data[0]});
        })
    }
    else{
        res.redirect('/');
    }
})

router.get('/adduser',function(req,res){
    if(req.session.islogin == 1)
    {
        res.render(__dirname+'/views/adduser',{'info':req.session});
    }
    else{
        res.redirect('/');
    }
})

router.post('/adduser',function(req,res){
    var currentDate = new Date();
    currentDate = currentDate.toISOString().slice(0,10);
    var newRecord = new userDetails({
        name : req.body.name ,
        username : req.body.username ,
        password : req.body.password ,
        city : req.body.city ,
        phoneno : req.body.phoneno ,
        gender : req.body.gender ,
        dob : req.body.dob ,
        role : req.body.role ,
        status : 'Pending' ,
        pic_id : "default.png" ,
        date_created : currentDate ,
        PI1 : '' ,
        PI2 : '' ,
        PI3 : ''
    });

    newRecord.save(function(err,data){
        if(err){
            throw err;
        }
        else{
            // console.log(data);
            SendNodeMail(data.username,data.name,data.password);
            res.send('user added');
        }
    })
})

router.get('/userlist',function(req,res){
    if(req.session.islogin == 1){
        res.render(__dirname+'/views/adminuserlist',{'info':req.session});
    }
    else{
        res.redirect('/');
    }
})

router.post('/getuserdata',function(req,res){
    if(req.session.islogin == 1){
        var tCount,fCount;
	var size=parseInt(req.body.length);
	var start=parseInt(req.body.start);
	var serby=req.body.columns[parseInt(req.body.order[0].column)].name.toString();
	var ser=req.body.search.value;
	var sRole=req.body.role;
	var sStatus=req.body.status;
	userDetails.count({}).exec(function(err,totalCount)
	{
		if(err)
			res.send(err);
		tCount=totalCount;
	});
	var fin={username :new RegExp('^'+ser+'.*$', "i"),role : new RegExp('^'+sRole+'.*$', "i"),status : new RegExp('^'+sStatus+'.*$', "i")};
	userDetails.count(fin).exec(function(err,totalCount)
	{
		if(err)
			res.send(err);
		fCount=totalCount;
	});
	if(serby=='username')
	{	
		var obj={'username':req.body.order[0].dir};
	}
	else if(serby=='phoneno')
	{	
		var obj={'phoneno':req.body.order[0].dir};
	}
	else if(serby=='city')
	{	
		var obj={'city':req.body.order[0].dir};
	}
	else if(serby=='status')
	{	
		var obj={'status':req.body.order[0].dir};
	}
	else
	{	
		var obj={'role':req.body.order[0].dir};
	}
	userDetails.find(fin).skip(start).sort(obj).limit(size).exec(function(err,data){
		if(err)
		{
			res.send(err);
		}
		var totalPages=Math.ceil(fCount/size);
		res.send({pageLength:size,recordsTotal:tCount,recordsFiltered:fCount,data: data});
	});
	
    }
    else{
        res.render('/');
    }
})

router.get('/switchAsUser',function(req,res){
    if(req.session.islogin == 1){
        if(req.session.role=='Admin')
        {
            req.session.role='Uadmin';
            res.redirect('/community/communitypanel');
        }
        else if(req.session.role='Uadmin')
        {
            req.session.role='Admin';
            res.redirect('/admin/profile');
        }
        else if(req.session.role=='User'||req.session.role=='Community Builder')
        {
            res.redirect('/profile');
        }
        else
            res.redirect('/');
    }
    else{
        res.redirect('/');
    }
})

//export this router
module.exports = router;