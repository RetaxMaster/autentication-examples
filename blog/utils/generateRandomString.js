function generateRandomString(length) {
    
    let randomString = "";
    const posibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        randomString += posibleChars.charAt(Math.floor(Math.random() * posibleChars.length));

    return randomString;

}

module.exports = generateRandomString;