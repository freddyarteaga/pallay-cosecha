document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------
    // MANEJO DE NAVBAR SCROLL
    // ---------------------------------
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(26, 28, 35, 0.95)';
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.5)';
        } else {
            navbar.style.background = 'rgba(11, 12, 16, 0.85)';
            navbar.style.boxShadow = 'none';
        }
    });

    // ---------------------------------
    // MANEJO DEL CARRITO (LÓGICA CON LOCAL STORAGE)
    // ---------------------------------
    const cartBtn = document.getElementById('open-cart-btn');
    const closeBtn = document.getElementById('close-cart-btn');
    const overlay = document.getElementById('cart-overlay');
    const sideCart = document.getElementById('side-cart');
    
    const cartCounter = document.getElementById('cart-counter');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.querySelector('.btn-checkout'); // Botón de Proceder al Pago

    // PASO 1: Cargar el carrito desde el almacenamiento local del navegador (LocalStorage).
    // Esto asegura que si el usuario recarga la página, no pierda sus productos.
    let cart = JSON.parse(localStorage.getItem('pallay_cart')) || [];

    // Funciones para abrir y cerrar el panel lateral visualmente
    const openCart = () => {
        sideCart.classList.add('active');
        overlay.classList.add('active');
    };

    const closeCart = () => {
        sideCart.classList.remove('active');
        overlay.classList.remove('active');
    };

    cartBtn.addEventListener('click', openCart);
    closeBtn.addEventListener('click', closeCart);
    overlay.addEventListener('click', closeCart);

    // PASO 2: Función para guardar los cambios en el disco duro (LocalStorage) del usuario
    const saveCartToStorage = () => {
        // LocalStorage solo acepta textos puros, por eso usamos JSON.stringify para convertir el arreglo a texto.
        localStorage.setItem('pallay_cart', JSON.stringify(cart));
    };

    // PASO 3: Lógica para pintar el carrito en pantalla (Actualizar la Interfaz de Usuario UI)
    const updateCartUI = () => {
        // Calcular la cantidad total de "productos" sumando las cantidades de cada ítem
        const totalItems = cart.reduce((suma, item) => suma + item.quantity, 0);
        cartCounter.textContent = totalItems;

        // Limpiar el contenedor visual antes de volver a dibujar
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Tu carrito está vacío.</p>';
            cartTotalPrice.textContent = '$0 COP';
            checkoutBtn.disabled = true; // Desactivar el botón si no hay productos
            return;
        }

        checkoutBtn.disabled = false; // Activar el botón de pago
        let total = 0;

        // Dibujar cada producto en base al array 'cart'
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const cartArticle = document.createElement('div');
            cartArticle.classList.add('cart-item');
            
            // Inyectamos el HTML del producto. Usamos "data-index" para saber qué botón elimina qué producto.
            cartArticle.innerHTML = `
                <img src="${item.img}" alt="${item.name}" class="cart-item-img" style="width: 50px; border-radius: 8px;">
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <span class="cart-item-price">$${item.price.toLocaleString('es-CO')} COP</span>
                    <div class="cart-item-qty-controls">
                        <button class="icon-btn dec-item-btn" data-index="${index}"><i class="ph ph-minus"></i></button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="icon-btn inc-item-btn" data-index="${index}"><i class="ph ph-plus"></i></button>
                    </div>
                </div>
                <button class="icon-btn remove-item-btn" data-index="${index}">
                    <i class="ph ph-trash"></i>
                </button>
            `;

            cartItemsContainer.appendChild(cartArticle);
        });

        cartTotalPrice.textContent = '$' + total.toLocaleString('es-CO') + ' COP';

        // Volver a activar la función de escuchar clicks en los basureros recién creados
        const trashBtns = document.querySelectorAll('.remove-item-btn');
        trashBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Selecciona el botón exacto, no el SVG o el path dentro de él
                const btnElement = e.target.closest('.remove-item-btn');
                const idx = parseInt(btnElement.getAttribute('data-index'));
                removeCartItem(idx);
            });
        });

        // Controles de cantidad (+)
        const incBtns = document.querySelectorAll('.inc-item-btn');
        incBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnElement = e.target.closest('.inc-item-btn');
                const idx = parseInt(btnElement.getAttribute('data-index'));
                cart[idx].quantity += 1;
                saveCartToStorage();
                updateCartUI();
            });
        });

        // Controles de cantidad (-)
        const decBtns = document.querySelectorAll('.dec-item-btn');
        decBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnElement = e.target.closest('.dec-item-btn');
                const idx = parseInt(btnElement.getAttribute('data-index'));
                if (cart[idx].quantity > 1) {
                    cart[idx].quantity -= 1;
                    saveCartToStorage();
                    updateCartUI();
                } else {
                    removeCartItem(idx);
                }
            });
        });
    };

    // PASO 4: Lógica para agregar productos
    const addBtns = document.querySelectorAll('.btn-add-cart');

    addBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            const price = parseFloat(btn.getAttribute('data-price'));
            const img = btn.getAttribute('data-img');

            // Revisar si el producto ya existe en nuestro carrito
            const existingItemIndex = cart.findIndex(item => item.id === id);

            if (existingItemIndex > -1) {
                // Si existe, solo le sumamos +1 a la cantidad.
                cart[existingItemIndex].quantity += 1;
            } else {
                // Si es un producto nuevo, lo agregamos al arreglo con quantity 1.
                cart.push({ id, name, price, img, quantity: 1 });
            }

            // Cada vez que modificamos el carrito, debemos guardarlo y actualizar la vista
            saveCartToStorage();
            updateCartUI();
            
            // Feedback visual rápido: abrimos el panel para que vea que se agregó
            openCart();
        });
    });

    // PASO 5: Eliminar productos enteros con el basurero
    const removeCartItem = (index) => {
        cart.splice(index, 1); // Borrar 1 producto en esa posición del arreglo
        saveCartToStorage(); // Guardar el cambio
        updateCartUI(); // Repintar el panel
    };

    // PASO 6 (Checkout): Conexión Simulada con un Servidor de Pagos
    checkoutBtn.addEventListener('click', async () => {
        try {
            // Cambiamos el texto del botón para que el usuario sepa que está cargando
            checkoutBtn.textContent = "Procesando...";
            checkoutBtn.disabled = true;

            // Enviamos el carrito a la ruta relativa (funciona tanto en local como en producción)
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // Exigencia de seguridad: Enviamos solo los ID y cantidades al server,
                // porque NUNCA debemos confiar en el precio enviado desde el navegador (frontend).
                // El server verificará el precio real de cada ID en la Base de Datos.
                body: JSON.stringify({ items: cart }) 
            });

            const data = await response.json();

            // Si el servidor nos responde exitosamente con una URL de pago (Ej. Stripe / MercadoPago URL)
            if (response.ok && data.paymentUrl) {
                // Redirigimos al usuario a realizar el pago afuera de nuestro sitio
                window.location.href = data.paymentUrl;
            } else {
                alert("Hubo un error al generar el link de pago.");
            }

        } catch (error) {
            console.error("Error conectando con el servidor:", error);
            alert("Error de conexión. Asegúrate que el servidor esté corriendo.");
        } finally {
            // Regresamos el botón a la normalidad si hubo error
            checkoutBtn.textContent = "Proceder al Pago";
            checkoutBtn.disabled = false;
        }
    });

    // Inicialización: La primera vez que carga la página, pintamos el carrito si había cosas guardadas
    updateCartUI();
});
