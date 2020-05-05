const nodemailer = require("nodemailer");
var admin = require("firebase-admin");

var serviceAccount = require("./saik-wsp20-firebase-adminsdk-hcy5x-d29354d4a3.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://saik-wsp20.firebaseio.com"
});

const Constants = require('./myconstants.js')

const updateVerifyStatus = (token) => {
    const db = admin.firestore();
    db.collection(Constants.COLL_USERSTOKEN).where("token", "==", token)
  .get()
  .then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
          db.collection(Constants.COLL_USERSTOKEN).doc(doc.id).update({isVerified: true});
      });
 })
}

const verfyUser = async(user) => {
    const token = uniqid();
    let payload = {
        token: token,
        userId: user.uid,
        user: {email: user.email, name: user.displayName},
        isVerified: false
    }
    console.log("Payload:", payload);
    const db = admin.firestore();
    await db.collection(Constants.COLL_USERSTOKEN).doc(user.uid).set(payload);
    await mailer.send({
        action: "verify_email",
        send_to: user.email,
        subject: "Verify Email!",
        data: {name:user.displayName, token: token},
    });
}
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

async function verifyIdToken(idToken) {
    try {
        const decodedIdToken = await admin.auth().verifyIdToken(idToken)
        return decodedIdToken
    } catch (e) {
        return null
    }
}

async function getOrderHistory(decodedIdToken){
    try {
        const collection = admin.firestore().collection(Constants.COLL_ORDERS)
        let orders = []
        const snapshot = await collection.where("uid", "==", decodedIdToken.uid).orderBy("timestamp").get()
        snapshot.forEach(doc => {
            orders.push(doc.data())
        })
        return orders
    } catch (e) {
        return null
    }
}

const createEmailPayload = (carts) => {
    let sum = 0;
    let results = [];
    let obj = {};
    if(carts.length) {
    carts.forEach((item) => {
            obj.name = item.product.name,
            obj.price = item.product.price,
            obj.qty = item.qty,
            obj.rowTotal = item.product.price * item.qty,
            obj.summary = item.product.summary || 'N/A'
            sum += obj.rowTotal;
            results.push(obj)
        })
    }
    return {sum,results}
}


async function checkOut(data) {
    data.timestamp = admin.firestore.Timestamp.fromDate(new Date())
    const {user} = data;
    let email_payload = await createEmailPayload(data.cart);
    await mailer.send({
        action: "order_checkout",
        send_to: user.email,
        subject: "Order Invoice!",
        data: {user: user.email, grand:email_payload.sum, results: email_payload.results},
      });
    try{
    const collection = admin.firestore().collection(Constants.COLL_ORDERS)
    await collection.doc().set(data)
    } catch (e){
        throw e
    }
}

// async function checkOut(data){
//     data.timestamp = admin.firestore.Timestamp.fromDate(new Date())
//     try{
//         const collection = admin.firestore().collection(Constants.COLL_ORDERS)
//         await collection.doc().set(data)
//     } catch (e) {
//         throw e
//     }
// }

module.exports = {
    createUser,
    listUsers,
    verifyIdToken,
    getOrderHistory,
    checkOut,
}

