import express from "express"
import dotenv from "dotenv"


//importing mongoose
import mongoose from "mongoose"
import path from 'path'
import { fileURLToPath } from 'url';
import cors from 'cors'

import cookieParser from "cookie-parser"

//Scheduler job
import './utils/scheduler/reminderJob.js'

//importing routers
import authRecruitingRoute from './routes/authRecruiting.js'
import mailRoute from './routes/mail.js'
import authEnterpriseRoute from './routes/authEnterprise.js'
import recruitingRoutes from './routes/recruiting.js'
import recruitingTeam from './routes/recruitingTeam.js'
import authRoute from './routes/auth.js'
import enterpriseRoute from './routes/enterprise.js'
import enterpriseTeamRoute from './routes/enterpriseTeam.js'
import jobRoute from './routes/jobs.js'
import candidateRoute from './routes/candidate.js'
import messageRoute from './routes/message.js'
import invoiceRoute from './routes/invoice.js'
import supportRoute from './routes/support.js'
import activityRoute from './routes/activityRoute.js'
import taskRoute from './routes/task.js'


// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//app configure
const port = process.env.PORT || 8080


const app = express()
dotenv.config()

// CORS options
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            "http://localhost:3000",
            "https://app-ui-tiyf.onrender.com",
            "https://app-backend-jna4.onrender.com",
            "https://admin-ui-l3vq.onrender.com",
            "https://admin-backend-1vl2.onrender.com",
            //Cors Origin for hostinger
            "https://app.uphire.in",
            "https://admin.uphire.in",
            "https://api.app.vms.uphire.in",
            "https://api.admin.vms.uphire.in"
        ];
        // Allow requests with no origin (like mobile apps or CURL)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"], // Add OPTIONS
    credentials: true,
};


// Preflight request handling for OPTIONS
app.options("*", cors(corsOptions)); // Allow OPTIONS for all routes

//middleware for using cors
app.use(cors(corsOptions));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//this middleware for authentication
app.use(cookieParser())
//using json middleware where we can easily get our json data
app.use(express.json())
app.use(express.urlencoded({ extended: true }));


//connecting with mongodb atlas

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO,{
                serverSelectionTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                family: 4, // 🔥 critical for VPS DNS issues
        })
        console.log("connected to mongodb!")
    } catch (err) {
        throw err
    }
}
mongoose.connection.on("disconnected", () => {
    console.log("mongodb disconnected")
})
mongoose.connection.on("connected", () => {
    console.log("mongodb connected")
})

//middleware

app.use('/api/authrecruiting', authRecruitingRoute)
app.use('/api/mail', mailRoute)
app.use('/api/authenterprise', authEnterpriseRoute)
app.use('/api/recruiting', recruitingRoutes)
app.use('/api/recruitingteam', recruitingTeam)
app.use('/api/auth', authRoute)
app.use('/api/enterprise', enterpriseRoute)
app.use('/api/enterpriseteam', enterpriseTeamRoute)
app.use('/api/job', jobRoute)
app.use('/api/candidate', candidateRoute)
app.use('/api/message', messageRoute)
app.use('/api/invoice', invoiceRoute)
app.use('/api/support',supportRoute)
app.use('/api/activity',activityRoute)
app.use('/api/task',taskRoute)


app.get('/', (req, res) => {
    res.send("Bahut maja ara hai bhai🐱")
})

// Serve static files from the 'uploads/jobdocs' directory
app.use('/jobdocs', express.static(path.join(__dirname, 'uploads/jobdocs')));

// Serve static files from the 'uploads/kycdocs' directory
app.use('/kycdocs', express.static(path.join(__dirname, 'uploads/kycdocs')));

// Serve static files from the 'uploads/resumedocs' directory
app.use('/resumedocs', express.static(path.join(__dirname, 'uploads/resumedocs')));

//Server static file from the 'uploads/invoice' directory
app.use('/invoicedocs', express.static(path.join(__dirname, 'uploads/invoice')));

//Server static file from the 'uploads/candidatedocs' directory
app.use('/candidatedocs', express.static(path.join(__dirname, 'uploads/candidatedocs')));

//Server static file from the 'uploads/consetproof' directory
app.use('/consetproof', express.static(path.join(__dirname, 'uploads/consetproof')));

//middleware for error handeling
app.use((err, req, res, next) => {
    const errStatus = err.status || 500
    const errmsg = err.message || "Something went wrong"
    return res.status(errStatus).json({
        success: false,
        status: errStatus,
        message: errmsg,
        stack: err.stack

    })
})


const startServer = async () => {
    try{
      await connect()
      app.listen(port,()=>{
        connect()
        console.log("connected on port:8000 to backend!")
      })

    }catch(err){
      console.log("Failed to start server",err)
      process.exit(1)
    }
}


startServer()