const jwt = require('jsonwebtoken')

const middlewareController = {

    //verifyToken

    verifyToken: (req, res, next) => {
        const token = req.headers.token;
        if (token) {
            const accessToken = token.split(" ")[1]
            jwt.verify(accessToken, process.env.SECRET_TOKEN, (err, user) => {
                if (err) {
                    res.status(403).json('Token is not valid')
                }
                req.user = user
                next()
            })
        }
        else {
            res.status(401).json("You're not authenticated.")
        }
    },

    verifyTokenAndAdminAuth: (req, res) => {
        middlewareController.verifyToken(req, res, () => {
            if (req.user.id === req.params, id || req.user.admin) {
                next()
            }
            else {
                res.status(403).json("You're not allowed.")
            }
        })
    }
}

module.exports = middlewareController;