SquaredPicture Website

Overview
- Static multi-page site for ordering custom square photo magnets.
- Core flow: upload photos -> confirm -> checkout -> payment -> thank-you.

Key Pages
- index.html: homepage and entry point
- order.html: image upload and crop
- confirm.html: preview and confirm
- checkout.html: customer details and payment
- thankyou.html: success page
- payment-fail.html: payment failure page

Tranzila Integration (current)
- Client-side pages: checkout.html, checkout.js
- Backend proxy + handshake: server.js
- Related docs/screenshots: info/TRANZILA_INTEGRATION.md/

Local Development
1) Install dependencies
   npm install
2) Start server
   npm start
3) Open in browser
   http://localhost:3000/checkout.html

Notes
- This repository currently uses a Node server for the Tranzila iframe flow.
- Environment variables are stored in .env (do not commit).
