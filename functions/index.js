const functions = require('firebase-functions');
const express = require('express')
const app = express()
const path=require('path')

exports.httpReq = functions.https.onRequest(app)

app.use(express.urlencoded({extended: false}))
app.use('/public', express.static(path.join(__dirname, '/static')))

//set template engine
app.set('view engine', 'ejs')
//location of ejs files
app.set('views', './ejsviews')

//frontend programming

function frontendHandler(req, res) {
    // eslint-disable-next-line no-path-concat
    res.sendFile(__dirname + '/prodadmin/prodadmin.html')
}
function Converter(req, res) {
    // eslint-disable-next-line no-path-concat
    res.sendFile(__dirname + '/prodadmin/temp.html')
}

app.get('/login', frontendHandler);
app.get('/home', frontendHandler);
app.get('/add', frontendHandler);
app.get('/show', frontendHandler);
app.get('/pass', frontendHandler);


//backend programming

const session = require('express-session')
app.use(session(
    {
        secret: 'anysecrestring.asdfghj',
        name: '__session',
        saveUninitialized: false,
        resave: false
    }
))
const firebase = require('firebase')

//Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCjZNbmODkd5PvLQB_mb1qjWo3AZ51un_4",
    authDomain: "saik-wsp20.firebaseapp.com",
    databaseURL: "https://saik-wsp20.firebaseio.com",
    projectId: "saik-wsp20",
    storageBucket: "saik-wsp20.appspot.com",
    messagingSenderId: "692538130674",
    appId: "1:692538130674:web:6d5420842138a2bb2f106b"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  const Constants = require('./myconstants.js')

app.get('/', auth, async (req, res) => {
    const cartCount = req.session.cart ? req.session.cart.length : 0
    const coll = firebase.firestore().collection(Constants.COLL_PRODUCTS)
    try {
        let products = []
        const snapshot = await coll.orderBy("name").get()
        snapshot.forEach(doc => {
            products.push({id: doc.id, data: doc.data()})
        })
        res.setHeader('Cache-Control', 'private');
        res.render('storefront.ejs', {error: false, products, user: req.user, cartCount})
    } catch (e) {
        res.setHeader('Cache-Control', 'private');
        res.render('storefront.ejs', {error: e, user: req.user, cartCount})

    }
})

app.get('/b/about', auth, (req, res) => {
    const cartCount = req.session.cart ? req.session.cart.length : 0
    res.setHeader('Cache-Control', 'private');
    res.render('about.ejs', {user: req.user, cartCount})
})

app.get('/b/contact', auth, (req, res) => {
    const cartCount = req.session.cart ? req.session.cart.length : 0
    res.setHeader('Cache-Control', 'private');
    res.render('contact.ejs', {user: req.user, cartCount})
})

app.get('/b/signin', (req, res) => {
    const cartCount = req.session.cart ? req.session.cart.length : 0
    res.setHeader('Cache-Control', 'private');
    res.render('signin.ejs', {error: false, user: req.user, cartCount: 0})
})

app.post('/b/signin', async (req, res) => {
    const email = req.body.email
    const password = req.body.password
    const auth = firebase.auth()
    try{
        const userRecord = await auth.signInWithEmailAndPassword(email, password)
        if(userRecord.user.email === Constants.SYSADMINEMAIL){
          res.setHeader('Cache-Control', 'private');
          res.redirect('/admin/sysadmin')
        } else {
            if (!req.session.cart){
                res.setHeader('Cache-Control', 'private');
                res.redirect('/')
            } else {
                res.setHeader('Cache-Control', 'private');
                res.redirect('/b/shoppingcart')
            }
        }
    } catch (e) {
        res.setHeader('Cache-Control', 'private');
        res.render('signin', {error: e, user: req.user, cartCount: 0})

    }
})

app.get('/b/signout', async(req, res) => {
    try{
        req.session.cart = null // empty the cart
        await firebase.auth().signOut()
        res.redirect('/')
    } catch (e) {
        res.send('Error: sign out')
    }
})

app.get('/b/profile', authAndRedirectSignIn, (req, res) => {
    const cartCount = req.session.cart ? req.session.cart.length : 0
    res.setHeader('Cache-Control', 'private');
    res.render('profile', {user: req.user, cartCount, orders: false})
})

app.get('/b/signup', (req,res) => {
    res.render('signup.ejs', {page: 'signup', user: null, error: false, cartCount: 0})
})

const ShoppingCart = require('./model/ShoppingCart.js')

app.post('/b/add2cart', async (req, res) =>{
    const id = req.body.docId
    const collection = firebase.firestore().collection(Constants.COLL_PRODUCTS)
    try{
        const doc = await collection.doc(id).get()
        let cart;
        if (!req.session.cart){
            // first time add to cart 
            cart = new ShoppingCart()
        } else{
            cart = ShoppingCart.deserialize(req.session.cart)
        }
        const {name, price, summary, image, image_url} = doc.data()
        cart.add({id, name, price, summary, image, image_url})
        req.session.cart = cart.serialize()
        res.setHeader('Cache-Control', 'private');
        res.redirect('/b/shoppingcart')
    } catch (e){
        res.setHeader('Cache-Control', 'private');
        res.send(JSON.stringify(e))
    }
})


app.get('/b/shoppingcart', authAndRedirectSignIn, (req, res) => {
    let cart 
    if (!req.session.cart) {
        cart = new ShoppingCart()
    } else {
        cart = ShoppingCart.deserialize(req.session.cart)
    }
    res.setHeader('Cache-Control', 'private');
    res.render('shoppingcart.ejs', {message: false, cart, user: req.user, cartCount: cart.contents.length})
})

app.post('/b/checkout', authAndRedirectSignIn, async (req, res) =>{
    if(!req.session.cart) {
        res.setHeader('Cache-Control', 'private');
        return res.send('Shopping Cart is Empty!')
    }

    //data format to share in firestore
    // collection: orders
    //{uid, timestamp, cart}
    // cart=[{product, qty} ....] // contents in shoppingcart

    const data = {
        uid: req.user.uid,
        timestamp: firebase.firestore.Timestamp.fromDate(new Date()),
        cart: req.session.cart
    }

    try {
        const collection = firebase.firestore().collection(Constants.COLL_ORDERS)
        await collection.doc().set(data)
        req.session.cart = null;
        res.setHeader('Cache-Control', 'private');
        return res.render('shoppingcart.ejs',
            {message: 'Checked Out Successfully!', cart: new ShoppingCart(), user: req.user, cartCount: 0})
    } catch (e) {
        const cart = ShoppingCart.deserialize(req.session.cart)
        res.setHeader('Cache-Control', 'private');
        return res.render('shoppingcart.ejs',
        {message: 'Checked Out Failed. Try Again Later!', cart, user: req.user, cartCount: cart.contents.length})
    }
})

app.get('/b/orderhistory', authAndRedirectSignIn, async (req, res) => {
    try{
        const collection = firebase.firestore().collection(Constants.COLL_ORDERS)
        let orders = []
        const snapshot = await collection.where("uid", "==", req.user.uid).orderBy("timestamp").get()
        snapshot.forEach(doc => {
            orders.push(doc.data())
        })
        res.setHeader('Cache-Control', 'private');
        res.render('profile.ejs', {user: req.user, cartCount: 0, orders})
    } catch (e) {
        Console.log('========', e)
        res.setHeader('Cache-Control', 'private');
        res.send('ERROR')
    }
})

//middleware
function authAndRedirectSignIn(req, res, next) {
    const user = firebase.auth().currentUser
    if(!user) {
        res.setHeader('Cache-Control', 'private');
       return res.redirect('/b/signin')
    } else {
        req.user = user
        return next()
    }
}
function auth(req, res, next) {
    req.user = firebase.auth().currentUser
    next()
}
const adminUtil = require('./adminUtil.js')
//admin api
app.post('/admin/signup', (req,res) => {
    return adminUtil.createUser(req, res)
})

app.get('/admin/sysadmin', authSysAdmin, (req, res) => {
    res.render('admin/sysadmin.ejs')
})

app.get('/admin/listUsers', authSysAdmin, (req, res) => {
    return adminUtil.listUsers(req, res)
    
})

function authSysAdmin(req, res, next) {
    const user = firebase.auth().currentUser
    if (!user || !user.email || user.email !== Constants.SYSADMINEMAIL){
       return res.send('<h1> System Admin Page: Access Denied!<h1>')
    } else {
        return next()
    }
}
//test code

app.get('/testlogin', (req, res) => {
    res.sendFile(path.join(__dirname, '/static/html/login.html'))
})

app.post('/testsignIn', (req,res) => {
    const email = req.body.email
    const password = req.body.pass
    // let page = `
    //     (POST) You entered: ${email} and ${password}
    // `;
    // res.send(page)
    const obj = {
        a: email,
        b: password,
        c: '<h1>login success</h1>',
        d: '<h1>login success</h1>',
        start: 1,
        end: 10
    }
    res.render('home', obj)
})

app.get('/testsignIn', (req, res) => {
    const email = req.query.email
    const password = req.query.pass
    let page = `
        You entered: ${email} and ${password}
    `;
    res.send(page)
})

app.get('/test', (req, res) =>  {
    const time = new Date().toString()
    let page = `
    <h1>Current Time At Server: ${time}</h1>
    `;
    res.header('refresh', 1)
    res.send(page)
})

app.get('/test2', (req, res) => {
    res.redirect('http://www.uco.edu')
})

