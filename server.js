const express = require("express")
const cors = require("cors")
 const app = express();
 const bodyParser = require("body-parser")
 const mongodb = require("mongodb");
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
//authenticate
let authenticate = function(req,res,next){
    if(req.headers.authorization){
        try {
            let result = jwt.verify(req.headers.authorization,secret)
            console.log(result)
                next();
          
        } catch (error) {
            res.status(401).json({message:"token Expired"})
        }
        }else{
        res.status(401).json({message:"not Authorized"})
        }
}
const secret = "kdfhhfhrhthwerfgherhtehrfgekrfg-4t83c4jrf08hgnefg8gh"
 const mongoClient = mongodb.MongoClient;
 const URL ="mongodb+srv://chat:chat@cluster0.0cjz5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
//  mongodb://localhost:27017/

app.use(bodyParser.json());


 let option = {
    origin : "*"
 }

 app.use(cors(option))
//convert to json data
app.use(express.json())

let tasklist = []

//get all data 
app.get("/task",async(req,res)=>{
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("task");
      let task = await db.collection("tasklist").find({}).toArray();
      await connection.close()
      res.json(task)

    } catch (error) {
        console.log(error)
    }
//   res.json(tasklist)
})
//get single task 
app.get("/task/:id",async(req,res)=>{

    try {
        
        let connection = await mongoClient.connect(URL);
        let db = connection.db("task");
        let objId = new mongodb.ObjectId(req.params.id);
        let task = await db.collection("tasklist").findOne({_id:objId})
       await connection.close()
       if(task){
        res.json(task)
       }else{
        res.status(401).json({massage :"task Not Found"})
       }
    
    } catch (error) {
        res.status(500).json({massage:"something went worng"})
    }

    // let task = tasklist.find(obj => obj.id == req.params.id);
    // if(task){
    //     res.json(task)
    // }else{
    //     res.status(404).json({message :"task not found"})
    // }
})

// update the data
app.put("/task-update/:id",async(req,res)=>{
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("task");
        let objId = new mongodb.ObjectId(req.params.id);
        await db.collection("tasklist").findOneAndUpdate({_id:objId},{$set:req.body})
        await connection.close();
        res.json({massage:"task update"})
    } catch (error) {
        console.log(error)
    }
    
})

// create Task
app.post("/create-task",async(req,res)=>{
  try {
        // connect to the Databse
        let connection = await mongoClient.connect(URL);

        //selecte data base
        let db = connection.db("task")
    
        //selete collection 
        // do opreaton 
        await db.collection("tasklist").insertOne(req.body)
    //  console.log(req.body)
        // close the connection
        connection.close();
        res.json({massage:"Task added"})

  } catch (error) {
    console.log(error)
  }
})


//delete data 
app.delete("/task/:id",async(req,res)=>{
 
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("task");
        let objId = new mongodb.ObjectId(req.params.id)
        await db.collection("tasklist").deleteOne({_id:objId});
        await connection.close();
        res.json({message : "task delete"})
        
    } catch ( error) {
        console.log(error)
    }
})



    
    // app.get('/search/:key', async (req, res) => {
    //     console.log(req.params.key);
    //     let connection = await mongoClient.connect(URL);
    //     let db = connection.db("task");
    //     let task = await db.collection("tasklist")
    // let data =  task.find(
    //     {
    //         "$or":[
    //             {title:{$refex:req.params.key}}
    //         ]
    //     }
    // );
    // res.send(data)

    //   });
 

    // searching api
    app.get("/search/:key",async(req,res)=>{
        console.log(req.params.key)
        
        try {
            let connection = await mongoClient.connect(URL);
            let db = connection.db("task");
          let task = await db.collection("tasklist").find({
            
                        "$or":[
                            {title:{$regex:req.params.key}},
                            {description:{$regex:req.params.key}}
                            
                        ]
                    }
          ).toArray()
          await connection.close()
          res.json(task)
    
        } catch (error) {
            console.log(error)
        }
    //   res.json(tasklist)
    })

// regestration api 
app.post("/register",async(req,res)=>{

try {
    let connection = await mongoClient.connect(URL);
    let db = connection.db("task");
    //encrypt the password
    let salt = await bcrypt.genSalt(10);
    let hash = await bcrypt.hash(req.body.password,salt);
    req.body.password = hash
    // console.log(hash)
    await db.collection('users').insertOne(req.body)
    connection.close();
    res.json({massage:"user register successfully"})
} catch (error) {
    console.log(error)
}

})


app.post("/login",async(req,res)=>{
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("task");
        
        let user =  await  db.collection('users').findOne({email:req.body.email})
        // console.log(user)
        if(user){
              let passwordReult = await bcrypt.compare(req.body.password,user.password)
              if(passwordReult){
                //generate token
                let token = jwt.sign({userid :user._id},secret,{expiresIn:'1h'})
                
                res.json(token)
              }else{
                res.status(401).json({massage:"user name or password not correct"})
              }
        }else{
            res.status(401).json({massage: "no users found"})
        }
    } catch (error) {
        console.log(error)
    }
})

// athenticate 
app.get("/dashboard",authenticate,(req,res,next)=>{

res.json({totalUser :20})
})


 app.listen(process.env.PORT ||3001);
