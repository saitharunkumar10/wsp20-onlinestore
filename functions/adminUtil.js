
var admin = require("firebase-admin");

var serviceAccount = require("./saik-wsp20-firebase-adminsdk-hcy5x-d29354d4a3.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://saik-wsp20.firebaseio.com"
});

async function createUser(req, res){
    const email = req.body.email
    const password = req.body.password
    const displayName = req.body.displayName
    const phoneNumber = req.body.phoneNumber
    const photoURL = req.body.photoURL
try {
    await admin.auth().createUser(
        {email, password, displayName, phoneNumber, photoURL}
    )
    res.render('signin.ejs', {page: 'signin', user:false, error:'Account created! Sign in please', cartCount: 0})
} catch (e) {
    res.render('signup.ejs', {error: e, user: false, page: 'signup', cartCount: 0})
}
}

async function listUsers(req, res) {
    try{
        const userRecord = await admin.auth().listUsers()
        res.render('admin/listUsers.ejs', {users: userRecord.users, error: false})
    } catch (e) {
        res.render('admin/listUsers.ejs', {users: false, error: e})
        
    }
}


module.exports = {
    createUser,
    listUsers
}

