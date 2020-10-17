var express=require('express')
var cors=require('cors')
var bodyParser=require('body-parser')
var app=express()
var router=require("./routes/router")
const mongoose=require('mongoose')

var port=process.env.PORT || 5000


app.use(bodyParser.json())
app.use(cors())
app.use(bodyParser.urlencoded({
    extended:false
}))

mongoose.connect("mongodb://localhost:27017/doghelper",{useNewUrlParser:true}).then(()=>{
    console.log("connected")
});

app.use('/',router)

app.listen(port,function(){
    console.log("server is running on port"+port)
})