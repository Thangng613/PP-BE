
const bcrypt = require('bcrypt')
const User = require('../models/User')
const jwt = require('jsonwebtoken')

let refreshTokens = [];

const authController = {
    //REGISTER
    registerUser: async (req, res) => {
        try {
            const salt = await bcrypt.genSalt(10)
            const hashed = await bcrypt.hash(req.body.password, salt)

            //Created new User
            const newUser = await new User({
                username: req.body.username,
                email: req.body.email,
                password: hashed
            });
            const user = await newUser.save();
            res.status(200).json(user);
        } catch (error) {
            res.status(500).json(error)
        }
    },
    //GENERATE ACCESS TOKEN 
    generateAccessToken: (user) => {
        return jwt.sign(
            {
                id: User.id,
                admin: User.admin
            },
            process.env.SECRET_TOKEN,
            { expiresIn: '20d' }
        )

    },
    //GENERATE REFRESH TOKEN 
    generateRefreshToken: (user) => {
        return jwt.sign(
            {
                id: User.id,
                admin: User.admin
            },
            process.env.SECRET_TOKEN,
            { expiresIn: '365d' }
        )
    },


    //LOGIN
    loginUser: async (req, res) => {
        try {
            const user = await User.findOne({ username: req.body.username });
            if (!user) {
                res.status(404).json('Wrong username!')
            }
            const validPassword = await bcrypt.compare(req.body.password, user.password)
            if (!validPassword) {
                res.status(404).json('Wrong password!')
            }
            if (user && validPassword) {
                const accessToken = authController.generateAccessToken(user)
                const refreshToken = authController.generateRefreshToken(user)
                refreshTokens.push(refreshToken)
                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: false,
                    path: '/',
                    sameSite: 'strict',
                })
                const { password, ...others } = user._doc;
                res.status(200).json({ ...others, accessToken })

            }
        } catch (error) {
            res.status(500).json(error)
        }
    },
    requestRefreshToken: async (req, res) => {
        //Take refresh token from user 
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json("You're not authenticated!")
        }
        if (!refreshTokens.includes(refreshToken)) {
            return res.status(403).json('Refresh token is not valid!')
        }
        jwt.verify(refreshToken, process.env.SECRET_KEY_REFRESH_TOKEN, (err, user) => {
            if (err) {
                console.log(err);
            }
            refreshTokens = refreshTokens.filter((token) => token !== refreshToken)
            //Create new access token, refresh token
            const newAccessToken = authController.generateAccessToken(user)
            const newRefreshToken = authController.generateRefreshToken(user)
            refreshTokens.push(newRefreshToken)
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: false,
                path: '/',
                sameSite: 'strict'
            })
            res.status(200).json({ accessToken: newAccessToken })
        })
    },

    //LOg OUT
    userLOgOut: async (req, res) => {
        res.clearCookie('refreshToken');
        refreshTokens = refreshTokens.filter((token) => token !== req.cookies.refreshToken)
        res.status(200).json("Log out successfully!")
    }
}


module.exports = authController;