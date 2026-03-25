/**
 * cartUtils.js – localStorage-based shopping cart
 * Cart structure: [{ product_id, farmer_id, name, unit, price, is_organic, category, farmer_name, maxQty, quantity }]
 */

const CART_KEY = 'randr_cart';

export function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}

export function getCartCount() {
  return getCart().reduce((s, i) => s + Number(i.quantity), 0);
}

export function getCartTotal() {
  return getCart().reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
}

/** Add qty of a product to cart. If already in cart, increases quantity (capped at maxQty). */
export function addToCart(product, qty = 1) {
  const cart = getCart();
  const idx = cart.findIndex(i => i.product_id === product.id);
  if (idx >= 0) {
    const newQty = Math.min(cart[idx].quantity + qty, cart[idx].maxQty);
    cart[idx] = { ...cart[idx], quantity: newQty };
  } else {
    cart.push({
      product_id: product.id,
      farmer_id: product.farmer_id,
      name: product.name,
      unit: product.unit,
      price: Number(product.price),
      is_organic: product.is_organic,
      category: product.category,
      farmer_name: product.farmer_name,
      maxQty: Number(product.quantity),
      quantity: qty,
    });
  }
  saveCart(cart);
  return cart;
}

/** Update quantity of a cart item. If qty <= 0, removes it. */
export function updateCartItem(productId, qty) {
  let cart = getCart();
  if (qty <= 0) {
    cart = cart.filter(i => i.product_id !== productId);
  } else {
    cart = cart.map(i => i.product_id === productId ? { ...i, quantity: Math.min(qty, i.maxQty) } : i);
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(productId) {
  const cart = getCart().filter(i => i.product_id !== productId);
  saveCart(cart);
  return cart;
}
