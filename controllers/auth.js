const { db } = require("../db-conncetion")
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs')
const {promisify }= require('util')

exports.register = (req, res)=>{
    console.log(req.body)
    // const name = req.body.name
    // const email = req.body.email
    // const password = req.body.password
    // const passwordConfirm = req.body.passwordConfirm
    //This code written above is the same as what is below, it has been distructured in the form below

    const { name, email, password, passwordConfirm } = req.body

    db.query('SELECT email FROM users WHERE email = ?', [email], async(error, results)=>{
        if(error)
        {
            console.log(error)
        }

        if(results.length > 0)
        {
            return res.render('register', {
                message:'Email already exists'
            })
        }
        else if(password !== passwordConfirm)
        {
            return res.render('register', {
                message:'Passwords do not match'
            })
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword);

        db.query('INSERT INTO users SET ?',{name: name, email: email, password: hashedPassword}, (error, result)=>{
            if(error)
            {
                console.log(error)
            }
            else
            {
                console.log(result)
                return res.render('register', {
                    message:'Registered'
                })
            }
        })
    })

    //res.send("Sent")
}

exports.login =async(req, res)=>{
    try {
        const {email, password} = req.body;
        if(!email || !password)
        {
            return res.status(400).render('login',{
                message:'Please provide an email and password'
            })
        }

        db.query('SELECT * FROM users WHERE email = ?',[email], async(error, result)=>{
            console.log(result)
            if(!result || !(await bcrypt.compare(password, result[0].password)))
            {
                res.status(401).render('login',{
                    message:'Email or Password is incorrect'
                })
            }
            else{
                const id = result[0].id

                const token = jwt.sign({id}, process.env.JWT_SECRET,{
                    expiresIn: process.env.EXPIRES_IN
                })

                console.log('The token is: '+token)
                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }
                res.cookie('jwt', token, cookieOptions)
                res.status(200).redirect('/')
            }
        })
    } catch (error) {
        console.log(error)
    }
}

exports.isLoggedIn = async(req, res, next)=>{
    if(req.cookies.jwt)
    {
        try {
            //1)verify token
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            console.log(decoded)

            //2)Check if user still exists
            db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result)=>{
                console.log(result);
                if(!result)
                {
                    return next();
                }

                req.user = result[0];
                return next();
            })
        } catch (error) {
            console.log(error)
            return next();
        }
    }
    else{
        next();
    }
}

exports.logout =async(req, res)=>{
    res.cookie('jwt', 'logout', {
        expires:new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });

    res.status(200).redirect('/');
}