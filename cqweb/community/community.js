var express = require('express');
var path = require('path');
const router = express.Router();
var multer = require('multer');
var ObjectId = require('mongodb').ObjectID;

// Access static files
router.use(express.static(path.join(__dirname,'../public')));

var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userDetails = mongoose.model("userdetails");
var communityDetails = mongoose.model("communitydetails");

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

router.get('/communitypanel',function(req,res){
    if(req.session.islogin == 1){
        communityDetails.find({$or:[{'owner.username':req.session.username},{'admin.user':req.session.username}]}).exec((err,data1)=>{
            if(err)
                res.send(err);
            communityDetails.find({'members.username':req.session.username}).exec((err,data2)=>{
                if(err)
                    res.send(err);
                communityDetails.find({'request.username':req.session.username}).exec((err,data3)=>{
                    if(err)
                        res.send(err);
                    userDetails.find({username: req.session.username}).exec((err,updata)=>{
                        if(err)
                            res.send(err);
                            res.render('../community/views/communitylist',{community1 : data1,community2 : data2,community3 : data3});
                    });
                });
            });
        });
    }
});

router.get('/list',function(req,res){

    if(req.session.islogin==1)
    {
        res.render('../community/views/SearchCommunity');
    }
    else
        res.redirect('/');

})

router.get('/AddCommunity',function(req,res){
    if(req.session.islogin == 1){
        res.render(__dirname+'/views/addcommunity');
    }
    else{
        res.redirect('/');
    }
})

router.get('/switchAsAdmin',function(req,res){
    if(req.session.islogin == 1){
        res.redirect('/admin/profile');
    }
    else{
        res.redirect('/');
    }
})

router.post('/addcomm',function(req,res){
    if(req.session.islogin == 1){
        upload(req,res,function(err){
            if(err){
                throw err;
            }
            if(req.file == undefined) {
                picpath = "defaultcomm.png"
            }
            else {
                picpath = req.file.filename;
            }
            var newCommunity = new communityDetails({
                name : req.body.Com_Name ,
                membershipRule : req.body.role ,
                location : 'N/A' ,
                owner : {
                    UID : req.session.UID ,
                    username : req.session.username ,
                    name : req.session.name ,
                    pic_id : req.session.pic_id
                },
                createDate : new Date().toISOString().slice(0,10) ,
                activity : 'Active' ,
                description : req.body.quill ,
                pic_id : picpath ,
                members : [] ,
                request : [] ,
                admin : [] ,
                invited : []
            })
            newCommunity.save(function(err,data){
                if(err){
                    throw err;
                }
                else{
                    res.redirect('/community/communitypanel');
                }
            })
        })
    }
    else{
        res.redirect('/');
    }
})

router.get('/communityList',function(req,res) {
    if(req.session.islogin == 1) {
        res.render(__dirname+'/views/admincommlist',{'info':req.session});
    }
    else {
        res.render('/');
    }
})

//export this router
module.exports = router;