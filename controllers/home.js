// require pages
const ExpressError = require("../utils/error-handler/ExpressError.js");

module.exports.root = (req , res) => {
    res.send("Welcome to Express")
}