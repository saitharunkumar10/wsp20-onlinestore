// const nodemailer = require("nodemailer");
// const handlebars = require("handlebars");
// const fs = require("fs");
// const path = require("path");
// const config = require("config");

// const app_url = config.get("app_url");
// const USERNAME = config.get("user");
// const PASSWORD = config.get("pass");

// handlebars.registerHelper("app_url", () => app_url);

// let filePath;

// const send = ({ action = "order_checkout", send_to, subject, data }) => {
//   new Promise((resolve, reject) => {
//     if (action == "order_checkout") {
//       filePath = "/static/email/orderSuccess.hbs"
//     }

//     const readHTMLFile = (path, callback) => {
//       fs.readFile(path, { encoding: "utf-8" }, (err, html) => {
//         if (err) {
//           callback(err);
//         } else {
//           callback(null, html);
//         }
//       });
//     };

//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       secure: false,
//       auth: {
//         user: "saitharunkumar10@gmail.com",
//         pass: "@uc7yQ88",
//       },
//     });

//     readHTMLFile(path.join(__dirname + filePath), (err, html) => {
//       console.log("Email ERR:", err);
//       var template = handlebars.compile(html);
//       var htmlToSend = template(data);
//       var mailOptions = {
//         from: USERNAME,
//         to: `${send_to}`,
//         subject: subject || "No subject sent!",
//         html: htmlToSend,
//       };
//       transporter.sendMail(mailOptions, (error, response) => {
//         if (error) {
//           reject(error);
//         }
//         resolve(response);
//       });
//     });
//   });
// };

// module.exports = { send };