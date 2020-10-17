const express=require('express')
const router=express.Router();
const cors=require('cors')
const jwt=require('jsonwebtoken')
const bcrypt=require('bcrypt')

//schema object
const hospital=require('../hospitalData.js').Hospital
const witness=require('../hospitalData.js').Witness
const emergency=require('../hospitalData.js').Emergency


function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
  }
  
  function distanceInKmBetweenEarthCoordinates(lat1, lon1, lat2, lon2) {
    var earthRadiusKm = 6371;
  
    var dLat = degreesToRadians(lat2-lat1);
    var dLon = degreesToRadians(lon2-lon1);
  
    lat1 = degreesToRadians(lat1);
    lat2 = degreesToRadians(lat2);
  
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return earthRadiusKm * c;
  }



process.env.SECRET_KEY='jatin'

router.post('/register',(req,res)=>{
     const hospitalData={
         hospitalName:req.body.params.data.name,
         email:req.body.params.data.email,
         password:req.body.params.data.password,
         openingTime:req.body.params.data.openingTime,
         closingTime:req.body.params.data.closingTime,
         address:[{latitude:req.body.params.data.coordLat,longitude:req.body.params.data.coordLong}]
     }
     hospital.findOne({
         email:req.body.params.data.email
     }).then(user => {
         //console.log(user)
         if(!user)
         {
             bcrypt.hash(req.body.params.data.password,10,(err,hash)=>{
                 hospitalData.password=hash
                 hospital.create(hospitalData)
                 .then(user=>{
                     res.json({status_code:"OK"})
                 }).catch(err =>{
                     res.json({status_code:"NOT OK"})
                 })
             })
         }
         else
         {
            res.json({status_code:"NOT OK"})
         }
     }).catch(err=>{
         res.json({status_code:"NOT OK"})
     })
})

router.post('/acceptRequest',async (req,res)=>{

    jwt.verify(req.body.headers['authorization'],process.env.SECRET_KEY, async function(err,data){
        if(err)
        {
            res.json("NOT OK")
        }
        else
        {
            await hospital.update({_id:req.body.params.hospital_id},{$push:{'acceptedCase':{case_id:req.body.params.case_id}}}).then(result =>{
                console.log(result)})
            await hospital.update({_id:req.body.params.hospital_id},{$pull:{'newCase':{case_id:req.body.params.case_id}}}).then(result =>{
                console.log(result)})
            res.json("OK")
        }
    })
})

router.post('/login',(req,res)=>{
    hospital.findOne({
        email:req.body.params.data.email
    }).then(user=>{
        if(user){
            
            if(bcrypt.compareSync(req.body.params.data.password,user.password)){
                const payload={
                    name:user.hospitalName,
                    email:user.email,
                    _id:user._id,
                    coordLat:user.address[0].latitude,
                    coordLong:user.address[0].longitude
                }
                let token=jwt.sign(payload,process.env.SECRET_KEY ,{
                    expiresIn:1440
                })
                res.json({
                    status_code:"OK",
                    currData:payload,
                    token:token
                })
            }
            else{
                res.json({
                    status_code:"NOT OK",
                    msg:"Password Dont match"
                })
            }
        }
        else
        {
            res.json({
                status_code:"NOT OK",
                msg:"User Dont Exist"
            })
        }
    }).catch(err =>{
        res.json({
            status_code:"NOT OK",
            msg:"Undefined Error"
        })
    })
})



router.post('/addWitness',(req,res)=>{
    
const witnessData={
    number:req.body.number,
    name:req.body.name
}

    witness.findOne({
        number:req.body.number
    }).then(currwitness=>{
        if(!currwitness)
        {
            witness.create(witnessData).then(user=>{
                res.json({status_code:"OK"})
            }).catch(err=>{
                res.json({status_code:"NOT OK"})
            })
        }
        else
        {
            res.json({status_code:"OK"})
        }
    })
})




router.get('/emergencies',  (req,res)=>{
    let finaldata=[]
    jwt.verify(req.headers['authorization'],process.env.SECRET_KEY, async function(err,data){
        if(err)
        {
            res.json(err)
        }
        else{
           await hospital.find({
                _id:data._id
            }).then (async curr=>{
                //console.log(curr)
                for(i=0;i<curr[0].newCase.length;i++)
                {
                   await emergency.find({_id:curr[0].newCase[i].case_id}).then(a=>{
                        //console.log(a)
                        finaldata.push(a);
                    })
                }

                let acceptedCases=[]

                for(i=0;i<curr[0].acceptedCase.length;i++)
                {
                    await emergency.find({_id:curr[0].acceptedCase[i].case_id}).then(a=>{
                        //console.log(a)
                        acceptedCases.push(a);
                    })
                }
                
                //console.log(finaldata)
                res.json({finaldata,acceptedCases})
            })
        }
    });
    
})


router.post('/respond',(req,res)=>{
    //console.log(req.body)
    jwt.verify(req.body.headers['authorization'],process.env.SECRET_KEY, async function(err,data){
        if(err)
        {
            res.json("NOT OK")
        }
        else{
            await hospital.update({_id:data._id},{$push:{'resolvedCase':{case_id:req.body.params.case_id}}}).then(curr=>{
                console.log(curr)
            })
            
            await hospital.update({_id:data._id},{$pull:{'acceptedCase':{case_id:req.body.params.case_id}}}).then(curr=>{
                console.log(curr)
            })

            await emergency.update({_id:req.body.params.case_id},{$set:{'report_link':req.body.params.link}}).then(curr=>{
                console.log(curr)
            })
            res.json("OK")
        }
    }).catch(err=>{
        res.json("NOT OK")
    })
    
})

router.post('/postEmergency',async (req,res)=>{
    
    const emergencyData={
        number:req.body.number,
        coordinates:[{longitude:req.body.coordLong,latitude:req.body.coordLat}],
        description:req.body.description,
        landmark:req.body.landmark
    }
    let case_id;
    await emergency.create(emergencyData).then(curr =>{
        console.log(curr)
        case_id=curr._id
    }).catch(err=>{
        res.json({status_code:"NOT OK"})
    })
    //console.log(case_id)
    witness.update({number:req.body.number},{$push:{'cases':{emergency_id:case_id}}}).then(curr=>{
        console.log(curr)
    }).catch(err=>{
        console.log(err);
    })

    await hospital.find({}).then(hospitals=>{
        console.log(hospitals)
        let curr=0,result=distanceInKmBetweenEarthCoordinates(hospitals[0].address[0].latitude,hospitals[0].address[0].longitude,req.body.coordLat,req.body.coordLong);
        for(i=1;i<hospitals.length;i++)
        {
            if(result>distanceInKmBetweenEarthCoordinates(hospitals[0].address[0].latitude,hospitals[0].address[0].longitude,req.body.coordLat,req.body.coordLong))
            {
                curr=i;
            }
        }
        //console.log(result);
         hospital.update({_id:hospitals[curr]._id},{$push:{'newCase':{case_id:case_id}}}).then(curr=>{
            console.log(curr);
        });
    })
    res.json({status_code:"OK"})
})



module.exports =router