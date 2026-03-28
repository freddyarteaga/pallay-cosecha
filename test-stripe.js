require('dotenv').config();
const stripeDevKey = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeDevKey);

async function test() {
    try {
        console.log("Testing Stripe with Key starting with:", stripeDevKey.substring(0, 10));
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Test Product' },
                        unit_amount: 1400,
                    },
                    quantity: 1,
                }
            ],
            mode: 'payment',
            success_url: 'http://localhost:3000/success.html',
            cancel_url: 'http://localhost:3000/cancel.html',
        });
        console.log("SUCCESS! URL:", session.url);
    } catch (e) {
        console.log("STRIPE ERROR:", e.message);
    }
}
test();
