const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// INICIALIZANDO STRIPE
// Si no hay llave en el archivo .env, Stripe lanzará un error guiado.
const stripeDevKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = require('stripe')(stripeDevKey);

const app = express();
const PORT = process.env.PORT || 3000;
// Dominio dinámico: Cuando estemos en Render.com, esta variable apuntará allá
const DOMAIN = process.env.DOMAIN_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());

// Servir frontend
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------------
// CATÁLOGO DEL BACKEND (Nuestra única fuente de verdad)
// ---------------------------------------------------------------------------------
const CATÁLOGO_SEGURO = [
    { id: "1", nombre: "Miel Ámbar Silvestre", precioReal: 14.00, img: "/assets/honey.png" },
    { id: "2", nombre: "Cacao Fino de Aroma", precioReal: 18.50, img: "/assets/cacao.png" },
    { id: "3", nombre: "Café Tueste Oscuro", precioReal: 22.00, img: "/assets/coffee.png" },
];

// ---------------------------------------------------------------------------------
// STRIPE CHECKOUT API
// ---------------------------------------------------------------------------------
app.post('/api/checkout', async (req, res) => {
    try {
        const { items } = req.body; 

        if (!items || items.length === 0) {
            return res.status(400).json({ error: "El carrito está vacío" });
        }

        // Construir el formato o "Line Items" exacto que exige Stripe
        const lineItemsParaStripe = items.map(cartItem => {
            const productoReal = CATÁLOGO_SEGURO.find(p => p.id === cartItem.id);
            
            if (!productoReal) {
                throw new Error(`Producto no reconocido: ${cartItem.id}`);
            }

            return {
                price_data: {
                    currency: 'usd', // Puedes cambiar a tu moneda local (mxn, pen, cop) si Stripe lo soporta.
                    product_data: {
                        name: productoReal.nombre,
                        // Stripe acepta imágenes absolutas (ej. urls vivas), por ahora lo omitimos
                    },
                    // Stripe trabaja en CENTAVOS. Entonces multiplicamos por 100. (Ej. $14.00 = 1400 centavos)
                    unit_amount: Math.round(productoReal.precioReal * 100),
                },
                quantity: cartItem.quantity,
            };
        });

        console.log("Creando Sesión en Stripe Checkout...");

        // Llamamos a los servidores reales de Stripe para crear una "Sesión de Pago"
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItemsParaStripe,
            mode: 'payment',
            // URLs de retorno automático del usuario:
            success_url: `${DOMAIN}/success.html`,
            cancel_url: `${DOMAIN}/cancel.html`,
        });

        // Retornamos al frontend la URL del Hosted Checkout de Stripe
        res.json({ paymentUrl: session.url });

    } catch (error) {
        console.error("Error validando el pedido en Stripe:", error.message);
        
        // Mensaje de auxilio si falta la llave secreta para que tú (el dev) sepas qué falló
        if (error.message.includes('API key')) {
             return res.status(500).json({ error: "Falta configurar la llave STRIPE_SECRET_KEY en el backend." });
        }

        res.status(500).json({ error: "Ocurrió un error general procesando el pago." });
    }
});


// INICIAR SERVIDOR
app.listen(PORT, () => {
    console.log(`✅ Servidor ejecutándose en ${DOMAIN}`);
    console.log(`🔒 Llave Stripe detectada: ${process.env.STRIPE_SECRET_KEY ? 'Sí' : 'No'}`);
});
