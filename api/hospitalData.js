const mongoose=require('mongoose')


const hospitalSchema=new mongoose.Schema({
    hospitalName:{
        type:String
    },
    email:{
        type:String
    },
    password:{
        type:String
    },
    openingTime:
    {
        type:String
    },
    closingTime:{
        type:String
    },
    address:[
        {
            latitude:String,
            longitude:String
        }
    ],
    newCase:[{
        case_id:String
    }],
    acceptedCase:[{
        case_id:String
    }],
    resolvedCase:[{
        case_id:String
    }]
})

const witnessSchema=new mongoose.Schema({
    number:{
        type:String
    },
    name:
    {
        type:String
    },
    cases:[
        {
            emergency_id:String
        }
    ]

})

const emergencySchema=new mongoose.Schema({
    number:{
        type:String
    },
    coordinates:[{
        longitude:String,
        latitude:String
    }],
    description:{
        type:String
    },
    landmark:{
        type:String
    },
    hospital_id:{
        type:Number
    },
    report_link:{
        type:String
    }
})


module.exports.Witness=mongoose.model('Witness',witnessSchema,'witness')
module.exports.Emergency=mongoose.model('Emergency',emergencySchema,'emergency')
module.exports.Hospital=mongoose.model('Hospital', hospitalSchema, 'hospital');