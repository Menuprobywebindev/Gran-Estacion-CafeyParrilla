// ============================================
// CONFIGURACIÓN GLOBAL
// ============================================
const CONFIG = {
    restaurantName: "Gran estacion cafe & parilla",
    whatsappNumber: "573046468673", // Cambiar por el número real (código país + número)
    currency: "$",
    deliveryZones: [
        { id: 1, name: "Zona Centro", cost: 5000 },
        { id: 2, name: "Zona Norte", cost: 7000 },
        { id: 3, name: "Zona Sur", cost: 4000 }
    ]
};

// ============================================
// MODO VISTA (Solo lectura para mesas con QR)
// Uso: agregar ?mesa=1 o ?modo=vista a la URL
// Ej: tumenu.com?mesa=3  → oculta carrito
//     tumenu.com         → menú completo con carrito
// ============================================
const urlParams = new URLSearchParams(window.location.search);
const VIEW_MODE = urlParams.has('mesa') || urlParams.get('modo') === 'vista';
const MESA_NUM = urlParams.get('mesa') || null;

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================
let cart = [];
let menu = [];

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    applyViewMode();
    loadMenu();
    if (!VIEW_MODE) {
        loadCartFromStorage();
        initEventListeners();
        updateCartUI();
    }
});

// ============================================
// APLICAR MODO VISTA
// ============================================
function applyViewMode() {
    if (!VIEW_MODE) return;

    // Ocultar carrito flotante
    const floatingCart = document.getElementById('floatingCart');
    if (floatingCart) floatingCart.style.display = 'none';

    // Ocultar panel del carrito y modal de checkout completo
    const cartPanel = document.getElementById('cartPanel');
    if (cartPanel) cartPanel.style.display = 'none';

    const checkoutModal = document.getElementById('checkoutModal');
    if (checkoutModal) checkoutModal.style.display = 'none';

    // Mostrar banner de mesa si viene el número
    if (MESA_NUM) {
        const banner = document.createElement('div');
        banner.id = 'mesa-banner';
        banner.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(26,26,26,0.92);
            color: #FF6B35;
            padding: 10px 24px;
            border-radius: 30px;
            font-family: 'Poppins', sans-serif;
            font-weight: 600;
            font-size: 14px;
            letter-spacing: 1px;
            z-index: 999;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255,107,53,0.3);
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            pointer-events: none;
        `;
        banner.textContent = `📍 Mesa ${MESA_NUM}`;
        document.body.appendChild(banner);
    }
}

// ============================================
// CARGAR MENÚ DESDE JSON
// ============================================
async function loadMenu() {
    try {
        const response = await fetch('menu.json');
        menu = await response.json();
        renderMenu();
    } catch (error) {
        console.error('Error al cargar el menú:', error);
        showError('No se pudo cargar el menú. Por favor, recarga la página.');
    }
}

// ============================================
// RENDERIZAR MENÚ
// ============================================
function renderMenu() {
    renderCategoryTabs();
    renderProducts(menu[0].id); // Mostrar primera categoría por defecto
}

// ============================================
// RENDERIZAR TABS DE CATEGORÍAS
// ============================================
function renderCategoryTabs() {
    const tabsContainer = document.getElementById('categoriesTabs');
    tabsContainer.innerHTML = '';

    menu.forEach((category, index) => {
        const tab = document.createElement('button');
        tab.className = 'category-tab';
        if (index === 0) tab.classList.add('active');
        tab.textContent = category.name;
        tab.dataset.categoryId = category.id;
        tab.onclick = () => switchCategory(category.id);
        tabsContainer.appendChild(tab);
    });
}

// ============================================
// CAMBIAR CATEGORÍA
// ============================================
function switchCategory(categoryId) {
    // Actualizar tabs activos
    document.querySelectorAll('.category-tab').forEach(tab => {
        if (tab.dataset.categoryId == categoryId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Renderizar productos de la categoría seleccionada
    renderProducts(categoryId);
}

// ============================================
// RENDERIZAR PRODUCTOS
// ============================================
function renderProducts(categoryId) {
    const menuContainer = document.getElementById('menuContainer');
    const category = menu.find(c => c.id == categoryId);
    
    if (!category) return;

    menuContainer.innerHTML = '';

    category.products.forEach((product, index) => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.style.animationDelay = `${index * 0.05}s`;

        const isAgotado = product.agotado === true;
        if (isAgotado) productItem.classList.add('product-agotado');

        let addButton = '';
        if (!VIEW_MODE) {
            if (isAgotado) {
                addButton = `<button class="add-product-btn agotado-btn" disabled title="Producto agotado">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>`;
            } else {
                addButton = `<button class="add-product-btn" onclick="quickAddToCart('${product.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                </button>`;
            }
        }

        productItem.innerHTML = `
            <div class="product-image-placeholder">
                ${product.image 
                    ? `<img src="${product.image}" alt="${product.name}" class="product-real-image">` 
                    : `<span class="product-tag-icon">${product.icon || '🏷️'}</span>`
                }
                ${isAgotado ? `<span class="agotado-badge">Agotado</span>` : ''}
            </div>
            <div class="product-details">
                <h3 class="product-name-new">${product.name}</h3>
                <p class="product-description-new">${product.description}</p>
                <p class="product-price-new">${CONFIG.currency}${formatPrice(product.price)}</p>
            </div>
            ${addButton}
        `;

        menuContainer.appendChild(productItem);
    });
}

// ============================================
// AGREGAR RÁPIDO AL CARRITO (botón circular)
// ============================================
function quickAddToCart(productId) {
    const product = findProductById(productId);
    if (!product) return;

    // Bloquear si está agotado
    if (product.agotado === true) {
        showNotification('Este producto está agotado', 'warning');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    saveCartToStorage();
    updateCartUI();
    showNotification('Producto agregado al carrito', 'success');
}

// ============================================
// SCROLL AL MENÚ
// ============================================
function scrollToMenu() {
    const menuSection = document.getElementById('menuSection');
    if (menuSection) {
        menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToStorage();
    updateCartUI();
    updateAllQuantityDisplays();
    showNotification('Producto eliminado', 'info');
}

function updateCartItemQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = newQuantity;
        saveCartToStorage();
        updateCartUI();
        updateAllQuantityDisplays();
    }
}

// ============================================
// ACTUALIZAR UI DEL CARRITO
// ============================================
function updateCartUI() {
    const cartBadge = document.getElementById('cartBadge');
    const cartBody = document.getElementById('cartBody');
    const cartTotal = document.getElementById('cartTotal');
    const cartFooter = document.getElementById('cartFooter');

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = calculateSubtotal();

    cartBadge.textContent = totalItems;

    if (cart.length === 0) {
        cartBody.innerHTML = `
            <div class="empty-cart">
                <p>Tu carrito está vacío</p>
                <span class="empty-icon">🛒</span>
            </div>
        `;
        cartFooter.style.display = 'none';
    } else {
        cartBody.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${CONFIG.currency}${formatPrice(item.price)} × ${item.quantity}</div>
                </div>
                <div class="cart-item-controls">
                    <div class="cart-item-qty">
                        <button class="qty-btn" onclick="updateCartItemQuantity('${item.id}', ${item.quantity - 1})">−</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateCartItemQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                    <button class="remove-item-btn" onclick="removeFromCart('${item.id}')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `).join('');

        cartTotal.textContent = `${CONFIG.currency}${formatPrice(subtotal)}`;
        cartFooter.style.display = 'block';
    }
    
    // No es necesario actualizar indicadores en este diseño
}

// ============================================
// CÁLCULOS
// ============================================
function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function calculateTotal(deliveryCost = 0) {
    return calculateSubtotal() + deliveryCost;
}

// ============================================
// MODAL DE CHECKOUT
// ============================================
function openCheckoutModal() {
    if (cart.length === 0) {
        showNotification('Tu carrito está vacío', 'warning');
        return;
    }

    const modal = document.getElementById('checkoutModal');
    modal.classList.add('active');
    renderDeliveryZones();
    updateOrderSummary();
    document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function renderDeliveryZones() {
    const deliveryZonesContainer = document.getElementById('deliveryZones');
    deliveryZonesContainer.innerHTML = CONFIG.deliveryZones.map((zone, index) => `
        <label class="radio-option">
            <input type="radio" name="deliveryZone" value="${zone.id}" ${index === 0 ? 'required' : ''} onchange="updateOrderSummary()">
            <span class="radio-custom"></span>
            <span class="radio-label">
                ${zone.name}
            </span>
        </label>
    `).join('');
}

function updateOrderSummary() {
    const orderSummary = document.getElementById('orderSummary');
    const selectedZone = getSelectedDeliveryZone();
    const subtotal = calculateSubtotal();
    const deliveryCost = selectedZone ? selectedZone.cost : 0;
    const total = calculateTotal(deliveryCost);

    let summaryHTML = cart.map(item => `
        <div class="summary-item">
            <span>${item.name} × ${item.quantity}</span>
            <span>${CONFIG.currency}${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');

    summaryHTML += `
        <div class="summary-item">
            <span>Subtotal</span>
            <span>${CONFIG.currency}${formatPrice(subtotal)}</span>
        </div>
        <div class="summary-item">
            <span>Domicilio</span>
            <span>${CONFIG.currency}${formatPrice(deliveryCost)}</span>
        </div>
        <div class="summary-item total">
            <span>Total</span>
            <span>${CONFIG.currency}${formatPrice(total)}</span>
        </div>
    `;

    orderSummary.innerHTML = summaryHTML;
}

function getSelectedDeliveryZone() {
    const selectedInput = document.querySelector('input[name="deliveryZone"]:checked');
    if (!selectedInput) return null;
    const zoneId = parseInt(selectedInput.value);
    return CONFIG.deliveryZones.find(zone => zone.id === zoneId);
}

function getSelectedPaymentMethod() {
    const selectedInput = document.querySelector('input[name="paymentMethod"]:checked');
    return selectedInput ? selectedInput.value : null;
}

// ============================================
// ENVÍO A WHATSAPP
// ============================================
function handleCheckoutSubmit(event) {
    event.preventDefault();

    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerAddress = document.getElementById('customerAddress').value.trim();
    const orderNotes = document.getElementById('orderNotes').value.trim();
    const deliveryZone = getSelectedDeliveryZone();
    const paymentMethod = getSelectedPaymentMethod();

    if (!deliveryZone || !paymentMethod) {
        showNotification('Por favor completa todos los campos', 'warning');
        return;
    }

    const message = buildWhatsAppMessage({
        customerName,
        customerPhone,
        customerAddress,
        orderNotes,
        deliveryZone,
        paymentMethod
    });

    const whatsappURL = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    // Abrir WhatsApp
    window.open(whatsappURL, '_blank');

    // Limpiar carrito y cerrar modal
    setTimeout(() => {
        cart = [];
        saveCartToStorage();
        updateCartUI();
        updateAllQuantityDisplays();
        closeCheckoutModal();
        document.getElementById('checkoutForm').reset();
        showNotification('Pedido enviado a WhatsApp', 'success');
    }, 1000);
}

function buildWhatsAppMessage(data) {
    const { customerName, customerPhone, customerAddress, orderNotes, deliveryZone, paymentMethod } = data;
    
    const subtotal = calculateSubtotal();
    const total = calculateTotal(deliveryZone.cost);

    let message = `🍔 *NUEVO PEDIDO - ${CONFIG.restaurantName}*\n\n`;
    
    message += `👤 *Cliente:* ${customerName}\n`;
    message += `📱 *Teléfono:* ${customerPhone}\n`;
    message += `📍 *Dirección:* ${customerAddress}\n`;
    message += `🚚 *Zona:* ${deliveryZone.name} (+${CONFIG.currency}${formatPrice(deliveryZone.cost)})\n`;
    message += `💳 *Método de pago:* ${paymentMethod}\n\n`;

    message += `📋 *DETALLE DEL PEDIDO:*\n`;
    cart.forEach(item => {
        message += `• ${item.name} × ${item.quantity} = ${CONFIG.currency}${formatPrice(item.price * item.quantity)}\n`;
    });

    message += `\n💰 *Subtotal:* ${CONFIG.currency}${formatPrice(subtotal)}\n`;
    message += `🛵 *Domicilio:* ${CONFIG.currency}${formatPrice(deliveryZone.cost)}\n`;
    message += `✅ *TOTAL:* ${CONFIG.currency}${formatPrice(total)}\n`;

    if (orderNotes) {
        message += `\n📝 *Observaciones:* ${orderNotes}\n`;
    }

    message += `\n¡Gracias por tu pedido! 🙌`;

    return message;
}

// ============================================
// EVENT LISTENERS
// ============================================
function initEventListeners() {
    // Carrito flotante
    document.getElementById('floatingCart').addEventListener('click', () => {
        document.getElementById('cartPanel').classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Cerrar carrito
    document.getElementById('closeCart').addEventListener('click', () => {
        document.getElementById('cartPanel').classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    document.getElementById('cartOverlay').addEventListener('click', () => {
        document.getElementById('cartPanel').classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Botón checkout
    document.getElementById('checkoutBtn').addEventListener('click', () => {
        document.getElementById('cartPanel').classList.remove('active');
        openCheckoutModal();
    });

    // Cerrar modal
    document.getElementById('closeModal').addEventListener('click', closeCheckoutModal);

    document.querySelector('.modal-overlay').addEventListener('click', closeCheckoutModal);

    // Submit formulario
    document.getElementById('checkoutForm').addEventListener('submit', handleCheckoutSubmit);
}

// ============================================
// UTILIDADES
// ============================================
function formatPrice(price) {
    return price.toLocaleString('es-CO');
}

function findProductById(productId) {
    for (const category of menu) {
        const product = category.products.find(p => p.id === productId);
        if (product) return product;
    }
    return null;
}

function updateAllQuantityDisplays() {
    // Esta función ya no es necesaria con el nuevo diseño
    // Los productos se agregan directamente con el botón circular
}

// ============================================
// LOCAL STORAGE
// ============================================
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

// ============================================
// NOTIFICACIONES
// ============================================
function showNotification(message, type = 'info') {
    // Crear notificación toast simple
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#06D6A0' : type === 'warning' ? '#FFD23F' : '#FF6B35'};
        color: ${type === 'warning' ? '#1A1A1A' : 'white'};
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        z-index: 3000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showError(message) {
    alert(message);
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);