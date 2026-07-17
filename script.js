const cart = [];
const homeScreen = document.getElementById('home-screen');
const cartScreen = document.getElementById('cart-screen');
const trackingScreen = document.getElementById('tracking-screen');
const cartToggle = document.getElementById('cart-toggle');
const cartCount = document.getElementById('cart-count');
const cartItems = document.getElementById('cart-items');
const cartDataInput = document.getElementById('cart-data');
const specialRequestsInput = document.getElementById('special-requests');
const checkoutForm = document.getElementById('checkout-form');
const checkoutButton = checkoutForm.querySelector('.checkout-btn');
const toast = document.getElementById('toast');
const tabs = document.querySelectorAll('.tab');
const menuCards = document.querySelectorAll('.menu-card');
const addButtons = document.querySelectorAll('.add-btn');
const sheetBackdrop = document.querySelector('.sheet-backdrop');
const timelineNodes = document.querySelectorAll('.timeline-node');
const splashScreen = document.getElementById('splash-screen');
const ratingModal = document.getElementById('rating-modal');
const stars = document.querySelectorAll('.star');
const deliveryComment = document.getElementById('delivery-comment');
const submitReviewButton = document.getElementById('submit-review-btn');
const backHomeButton = document.getElementById('back-home-btn');
const confettiLayer = document.getElementById('confetti-layer');
const reviewStateKey = 'us-eats-review-prompt';
const reviewDelayMs = 120000;
let trackingTimer = null;
let reviewTimer = null;
let selectedRating = 0;

const vibrate = (pattern) => {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 1200);
}

function updateCartUI() {
  cartCount.textContent = cart.length;
  renderCart();
  cartDataInput.value = JSON.stringify(cart);
}

function renderCart() {
  if (!cart.length) {
    cartItems.innerHTML = '<li>Your cart is empty.</li>';
    return;
  }

  cartItems.innerHTML = cart.map((item) => `<li>${item}</li>`).join('');
}

function openCart() {
  cartScreen.classList.add('open');
  cartScreen.setAttribute('aria-hidden', 'false');
  renderCart();
}

function closeCart() {
  cartScreen.classList.remove('open');
  cartScreen.setAttribute('aria-hidden', 'true');
}

function filterCards(mode) {
  menuCards.forEach((card) => {
    const matches = card.dataset.category === mode;
    card.classList.toggle('hidden', !matches);
  });
}

function playTrackingTimeline() {
  clearTimeout(trackingTimer);
  timelineNodes.forEach((node) => node.classList.remove('active'));

  let index = 0;
  const activateNextNode = () => {
    if (!trackingScreen.classList.contains('active')) {
      return;
    }

    if (index < timelineNodes.length) {
      timelineNodes[index].classList.add('active');

      if (index === timelineNodes.length - 1) {
        clearTimeout(reviewTimer);
        reviewTimer = setTimeout(() => {
          showReviewModal();
        }, 2000);
      }

      index += 1;
      trackingTimer = setTimeout(activateNextNode, 3000);
    }
  };

  activateNextNode();
}

function resetApp() {
  cart.length = 0;
  updateCartUI();
  clearTimeout(trackingTimer);
  clearTimeout(reviewTimer);
  timelineNodes.forEach((node) => node.classList.remove('active'));
  trackingScreen.classList.remove('active');
  trackingScreen.setAttribute('aria-hidden', 'true');
  homeScreen.classList.add('active');
  homeScreen.setAttribute('aria-hidden', 'false');
  closeCart();
  hideReviewModal();
  if (specialRequestsInput) {
    specialRequestsInput.value = '';
  }
  if (deliveryComment) {
    deliveryComment.value = '';
  }
  selectedRating = 0;
  stars.forEach((star) => star.classList.remove('active'));
  localStorage.removeItem(reviewStateKey);
}

function hideReviewModal() {
  ratingModal.classList.remove('show');
  ratingModal.setAttribute('aria-hidden', 'true');
}

function showReviewModal() {
  ratingModal.classList.add('show');
  ratingModal.setAttribute('aria-hidden', 'false');
  vibrate([100, 50, 100]);
}

function queueReviewPrompt(delayMs = reviewDelayMs) {
  clearTimeout(reviewTimer);
  reviewTimer = setTimeout(() => {
    if (trackingScreen.classList.contains('active')) {
      showReviewModal();
    } else {
      showReviewModal();
    }
  }, delayMs);
}

function launchConfetti() {
  const colors = ['#ff5a00', '#ffd700', '#ff7a24', '#ffffff'];
  confettiLayer.innerHTML = '';

  for (let i = 0; i < 40; i += 1) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    const left = Math.random() * 100;
    const duration = 1.6 + Math.random() * 1.2;
    const drift = (Math.random() - 0.5) * 220;
    piece.style.left = `${left}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--duration', `${duration}s`);
    piece.style.setProperty('--x-fall', `${drift}px`);
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    confettiLayer.appendChild(piece);
  }

  setTimeout(() => {
    confettiLayer.innerHTML = '';
  }, 2400);
}

addButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.menu-card');
    const itemName = card.querySelector('h3').textContent;
    cart.push(itemName);
    updateCartUI();
    vibrate(50);
    showToast('Added!');
  });
});

cartToggle.addEventListener('click', () => {
  vibrate(50);
  openCart();
});

sheetBackdrop.addEventListener('click', closeCart);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeCart();
  }
});

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    vibrate(50);
    tabs.forEach((btn) => btn.classList.remove('active'));
    tab.classList.add('active');
    filterCards(tab.dataset.mode);
  });
});

stars.forEach((star) => {
  star.addEventListener('click', () => {
    selectedRating = Number(star.dataset.rating);
    stars.forEach((item, index) => {
      item.classList.toggle('active', index < selectedRating);
    });
  });
});

submitReviewButton.addEventListener('click', () => {
  const reviewData = new FormData();
  reviewData.set('rating', String(selectedRating));
  reviewData.set('delivery_comment', deliveryComment.value.trim());
  reviewData.set('cart', JSON.stringify(cart));
  reviewData.set('special_requests', specialRequestsInput ? specialRequestsInput.value : '');

  fetch(checkoutForm.action, {
    method: 'POST',
    body: reviewData,
    headers: { Accept: 'application/json' }
  });

  launchConfetti();
  setTimeout(() => {
    resetApp();
  }, 3000);
});

backHomeButton.addEventListener('click', resetApp);

window.addEventListener('DOMContentLoaded', () => {
  filterCards('instant');
  const pendingReview = JSON.parse(localStorage.getItem(reviewStateKey) || 'null');
  if (pendingReview) {
    const remainingDelay = Math.max(0, reviewDelayMs - (Date.now() - pendingReview.scheduledAt));
    queueReviewPrompt(remainingDelay || reviewDelayMs);
  }

  setTimeout(() => {
    splashScreen.classList.add('fade-out');
  }, 2500);
});

checkoutForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const originalText = checkoutButton.innerHTML;
  checkoutButton.classList.add('is-loading');
  checkoutButton.disabled = true;
  checkoutButton.innerHTML = '<span class="btn-label">Sending…</span><i class="fa-solid fa-spinner fa-spin"></i>';

  vibrate(50);

  const formData = new FormData(checkoutForm);
  formData.set('cart', JSON.stringify(cart));
  formData.set('special_requests', specialRequestsInput ? specialRequestsInput.value : '');

  fetch(checkoutForm.action, {
    method: 'POST',
    body: formData,
    headers: { Accept: 'application/json' }
  });

  localStorage.setItem(reviewStateKey, JSON.stringify({ scheduledAt: Date.now() }));

  window.setTimeout(() => {
    homeScreen.classList.remove('active');
    homeScreen.setAttribute('aria-hidden', 'true');
    cartScreen.classList.remove('open');
    cartScreen.setAttribute('aria-hidden', 'true');
    trackingScreen.classList.add('active');
    trackingScreen.setAttribute('aria-hidden', 'false');

    checkoutButton.classList.remove('is-loading');
    checkoutButton.disabled = false;
    checkoutButton.innerHTML = originalText;

    playTrackingTimeline();
  }, 1000);
});
