const http = require('http')
const express = require('express')
const app = express()
const path = require('path')
const router = express.Router()
const {Pool} = require('pg')

const hostname = '127.0.0.1'; 
const port = 3000; 

//psql db connect
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'stealth',
    password: 'password',
    port: 5432,
});

function passwordValidator(password){
    if (password.length < 8) {
        return 'Password must be 8 characters long'
    }

    if (!/[a-z]/.test(password)) {
        return 'Password must contain lowercase'
    }

    if (!/[A-Z]/.test(password)) {
        return 'Password must contain uppercase'
    }

    if (!/[^a-zA-Z0-9]/.test(password)) {
        return 'Password must contain a symbol'
    }

    return 'pass'
}

function emailValidator(email){
    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)

}

function generateOTP(){
    return Math.floor(100000 + Math.random() * 900000).toString()
}

let otpStore = {}
async function storeOTP(otp/*,id*/) {
    const expireTime = 30000;
    otpStore[otp] = Date.now() + expireTime;
    // const {updateCurrOTP} = await pool.query("update users set otp = $1 where id = $2",[otp,id])

    setTimeout(async () => {
        delete otpStore[otp];
        // const {updateCurrOTP} = await pool.query("update users set otp = null where id = $1",[id])
    }, expireTime);
}

function validateOTP(otp) {
    if (otpStore[otp] && Date.now() <= otpStore[otp]) {
        return true;
    } else {
        return false;
    }
}


app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/api/register',async(req,res)=>{
    if(passwordValidator(req.body.password) === 'pass'){
        if(emailValidator(req.body.email)){
            const {add} = await pool.query("insert into users values(nextval('users_id_seq'),$1,$2,$3,$4)",[req.body.name, req.body.username, req.body.email,req.body.password])
            res.status(200).send('Registered')
            otp = generateOTP()
            storeOTP(otp)
            console.log(otp)
        }else{
            res.status(400).send('Enter email format')
        }
    }else{
        res.status(400).send(passwordValidator(req.body.password))
    }
})

app.post('/api/login',async (req,res)=>{
    const user = await pool.query("select * from users where username = $1 and password = $2",[req.body.username, req.body.password])
    console.log("loggedin")
    if(user.rows.length>0){
        res.status(200).send('Logged In')
    }else{
        res.status(400).send('Wrong Credentials')
    }
})

app.post('/api/sendOTP',async(req,res)=>{
    otp = generateOTP()
    storeOTP(otp)
    console.log(otp)
    res.status(200).send('New OTP Sent')
})

app.post('/api/validateOTP',async(req,res)=>{
    if(validateOTP(req.body.otp)){
        res.status(200).send('Success')
    }else{
        res.status(200).send('Wrong OTP/Expired')
    }
})

app.listen(port,()=>{
    console.log('COnnecTing to P0ST HuMaN exPErience...')
})