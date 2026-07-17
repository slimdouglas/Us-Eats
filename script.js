(function () {
  var cart = [];
  var homeScreen = document.getElementById('home-screen');
  var cartScreen = document.getElementById('cart-screen');
  var paymentScreen = document.getElementById('payment-screen');
  var trackingScreen = document.getElementById('tracking-screen');
  var cartToggle = document.getElementById('cart-toggle');
  var cartCount = document.getElementById('cart-count');
  var cartItems = document.getElementById('cart-items');
  var cartDataInput = document.getElementById('cart-data');
  var specialRequestsInput = document.getElementById('special-requests');
  var checkoutForm = document.getElementById('checkout-form');
  var checkoutButton = checkoutForm ? checkoutForm.querySelector('.checkout-btn') : null;
  var toast = document.getElementById('toast');
  var tabs = document.querySelectorAll('.tab');
  var menuCards = document.querySelectorAll('.menu-card');
  var addButtons = document.querySelectorAll('.add-btn');
  var sheetBackdrop = document.querySelector('.sheet-backdrop');
  var timelineNodes = document.querySelectorAll('.timeline-node');
  var splashScreen = document.getElementById('splash-screen');
  var ratingModal = document.getElementById('rating-modal');
  var stars = document.querySelectorAll('.star');
  var deliveryComment = document.getElementById('delivery-comment');
  var submitReviewButton = document.getElementById('submit-review-btn');
  var backHomeButton = document.getElementById('back-home-btn');
  var confettiLayer = document.getElementById('confetti-layer');
  var cameraFeed = document.getElementById('camera-feed');
  var scannerContainer = document.querySelector('.scanner-container');
  var paymentSuccess = document.getElementById('payment-success');
  var paymentSuccessText = paymentSuccess ? paymentSuccess.querySelector('h3') : null;
  var reviewStateKey = 'us-eats-review-prompt';
  var reviewDelayMs = 120000;
  var trackingTimer = null;
  var reviewTimer = null;
  var selectedRating = 0;
  var activeStream = null;
  var paymentTransitionTimer = null;

  function logError(error) {
    var message = 'Unknown error';
    if (error && error.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    if (window.console && window.console.error) {
      console.error(message);
    }
  }

  function safeGetStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function safeSetStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function safeRemoveStorage(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function safeParseStorage(key) {
    var rawValue = safeGetStorage(key);
    if (!rawValue) {
      return null;
    }

    try {
      return JSON.parse(rawValue);
    } catch (error) {
      return null;
    }
  }

  function vibrate(pattern) {
    if (navigator && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        // Ignore vibration errors.
      }
    }
  }

  function showToast(message) {
    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(function () {
      toast.classList.remove('show');
    }, 1200);
  }

  function updateCartUI() {
    if (cartCount) {
      cartCount.textContent = cart.length;
    }

    renderCart();

    if (cartDataInput) {
      cartDataInput.value = JSON.stringify(cart);
    }
  }

  function renderCart() {
    if (!cartItems) {
      return;
    }

    if (!cart.length) {
      cartItems.innerHTML = '<li>Your cart is empty.</li>';
      return;
    }

    cartItems.innerHTML = cart.map(function (item) {
      return '<li>' + item + '</li>';
    }).join('');
  }

  function openCart() {
    if (cartScreen) {
      cartScreen.classList.add('open');
      cartScreen.setAttribute('aria-hidden', 'false');
    }
    renderCart();
  }

  function closeCart() {
    if (cartScreen) {
      cartScreen.classList.remove('open');
      cartScreen.setAttribute('aria-hidden', 'true');
    }
  }

  function filterCards(mode) {
    if (!menuCards || !menuCards.length) {
      return;
    }

    menuCards.forEach(function (card) {
      if (!card || !card.dataset) {
        return;
      }

      var matches = card.dataset.category === mode;
      card.classList.toggle('hidden', !matches);
    });
  }

  function playTrackingTimeline() {
    if (!trackingScreen || !timelineNodes || !timelineNodes.length) {
      return;
    }

    clearTimeout(trackingTimer);

    timelineNodes.forEach(function (node) {
      if (node) {
        node.classList.remove('active');
      }
    });

    var index = 0;

    function activateNextNode() {
      if (!trackingScreen.classList.contains('active')) {
        return;
      }

      if (index < timelineNodes.length) {
        if (timelineNodes[index]) {
          timelineNodes[index].classList.add('active');
        }

        if (index === timelineNodes.length - 1) {
          clearTimeout(reviewTimer);
          reviewTimer = setTimeout(function () {
            showReviewModal();
          }, 2000);
        }

        index += 1;
        trackingTimer = setTimeout(activateNextNode, 3000);
      }
    }

    activateNextNode();
  }

  function stopCameraStream() {
    if (activeStream && activeStream.getTracks) {
      try {
        activeStream.getTracks().forEach(function (track) {
          track.stop();
        });
      } catch (error) {
        // Ignore stream stop issues.
      }
    }

    activeStream = null;

    if (cameraFeed) {
      try {
        cameraFeed.pause();
      } catch (error) {
        // Ignore pause errors.
      }

      try {
        cameraFeed.srcObject = null;
      } catch (error) {
        // Ignore srcObject errors.
      }
    }
  }

  function hideReviewModal() {
    if (ratingModal) {
      ratingModal.classList.remove('show');
      ratingModal.setAttribute('aria-hidden', 'true');
    }
  }

  function resetApp() {
    cart.length = 0;
    updateCartUI();
    clearTimeout(trackingTimer);
    clearTimeout(reviewTimer);
    clearTimeout(paymentTransitionTimer);
    stopCameraStream();

    if (timelineNodes && timelineNodes.length) {
      timelineNodes.forEach(function (node) {
        if (node) {
          node.classList.remove('active');
        }
      });
    }

    if (trackingScreen) {
      trackingScreen.classList.remove('active');
      trackingScreen.setAttribute('aria-hidden', 'true');
    }

    if (paymentScreen) {
      paymentScreen.classList.remove('active');
      paymentScreen.setAttribute('aria-hidden', 'true');
    }

    if (homeScreen) {
      homeScreen.classList.add('active');
      homeScreen.setAttribute('aria-hidden', 'false');
    }

    closeCart();
    hideReviewModal();

    if (scannerContainer) {
      scannerContainer.classList.remove('hidden');
    }

    if (paymentSuccess) {
      paymentSuccess.classList.add('hidden');
    }

    if (specialRequestsInput) {
      specialRequestsInput.value = '';
    }

    if (deliveryComment) {
      deliveryComment.value = '';
    }

    if (paymentSuccessText) {
      paymentSuccessText.textContent = 'Payment Successful. Face Card never declines. 🔥';
    }

    selectedRating = 0;

    if (stars && stars.length) {
      stars.forEach(function (star) {
        star.classList.remove('active');
      });
    }

    safeRemoveStorage(reviewStateKey);
  }

  function showPaymentSuccess(message) {
    if (scannerContainer) {
      scannerContainer.classList.add('hidden');
    }

    if (paymentSuccess) {
      paymentSuccess.classList.remove('hidden');
    }

    if (paymentSuccessText) {
      paymentSuccessText.textContent = message;
    }
  }

  function transitionToTracking() {
    if (paymentScreen) {
      paymentScreen.classList.remove('active');
      paymentScreen.setAttribute('aria-hidden', 'true');
    }

    if (trackingScreen) {
      trackingScreen.classList.add('active');
      trackingScreen.setAttribute('aria-hidden', 'false');
    }

    playTrackingTimeline();
  }

  function startFaceCardFlow() {
    if (scannerContainer) {
      scannerContainer.classList.remove('hidden');
    }

    if (paymentSuccess) {
      paymentSuccess.classList.add('hidden');
    }

    if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showPaymentSuccess('Camera shy? That\'s fine, your beauty is already on file. Approved! 🔥');
      paymentTransitionTimer = setTimeout(function () {
        transitionToTracking();
      }, 3000);
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(function (stream) {
        activeStream = stream;
        if (cameraFeed) {
          cameraFeed.srcObject = stream;
          cameraFeed.play().catch(function () {
            // Ignore playback issues.
          });
        }

        setTimeout(function () {
          stopCameraStream();
          showPaymentSuccess('Payment Successful. Face Card never declines. 🔥');
          paymentTransitionTimer = setTimeout(function () {
            transitionToTracking();
          }, 3000);
        }, 3500);
      })
      .catch(function () {
        showPaymentSuccess('Camera shy? That\'s fine, your beauty is already on file. Approved! 🔥');
        paymentTransitionTimer = setTimeout(function () {
          transitionToTracking();
        }, 3000);
      });
  }

  function showReviewModal() {
    if (ratingModal) {
      ratingModal.classList.add('show');
      ratingModal.setAttribute('aria-hidden', 'false');
    }

    vibrate([100, 50, 100]);
  }

  function queueReviewPrompt(delayMs) {
    if (typeof delayMs === 'undefined') {
      delayMs = reviewDelayMs;
    }

    clearTimeout(reviewTimer);
    reviewTimer = setTimeout(function () {
      showReviewModal();
    }, delayMs);
  }

  function launchConfetti() {
    if (!confettiLayer) {
      return;
    }

    var colors = ['#ff5a00', '#ffd700', '#ff7a24', '#ffffff'];
    confettiLayer.innerHTML = '';

    for (var i = 0; i < 40; i += 1) {
      var piece = document.createElement('span');
      piece.className = 'confetti-piece';
      var left = Math.random() * 100;
      var duration = 1.6 + Math.random() * 1.2;
      var drift = (Math.random() - 0.5) * 220;
      piece.style.left = left + '%';
      piece.style.background = colors[i % colors.length];
      piece.style.setProperty('--duration', duration + 's');
      piece.style.setProperty('--x-fall', drift + 'px');
      piece.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
      confettiLayer.appendChild(piece);
    }

    setTimeout(function () {
      confettiLayer.innerHTML = '';
    }, 2400);
  }

  function initializeInteractions() {
    if (addButtons && addButtons.length) {
      addButtons.forEach(function (button) {
        button.addEventListener('click', function () {
          var card = button.closest('.menu-card');
          if (!card) {
            return;
          }

          var itemName = card.querySelector('h3').textContent;
          cart.push(itemName);
          updateCartUI();
          vibrate(50);
          showToast('Added!');
        });
      });
    }

    if (cartToggle) {
      cartToggle.addEventListener('click', function () {
        vibrate(50);
        openCart();
      });
    }

    if (sheetBackdrop) {
      sheetBackdrop.addEventListener('click', closeCart);
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeCart();
      }
    });

    if (tabs && tabs.length) {
      tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          vibrate(50);
          tabs.forEach(function (btn) {
            btn.classList.remove('active');
          });
          tab.classList.add('active');
          filterCards(tab.dataset.mode);
        });
      });
    }

    if (stars && stars.length) {
      stars.forEach(function (star) {
        star.addEventListener('click', function () {
          selectedRating = Number(star.dataset.rating);
          stars.forEach(function (item, index) {
            item.classList.toggle('active', index < selectedRating);
          });
        });
      });
    }

    if (submitReviewButton) {
      submitReviewButton.addEventListener('click', function () {
        var reviewData = new FormData();
        reviewData.set('rating', String(selectedRating));
        reviewData.set('delivery_comment', deliveryComment ? deliveryComment.value.trim() : '');
        reviewData.set('cart', JSON.stringify(cart));
        reviewData.set('special_requests', specialRequestsInput ? specialRequestsInput.value : '');

        if (checkoutForm && checkoutForm.action) {
          fetch(checkoutForm.action, {
            method: 'POST',
            body: reviewData,
            headers: { Accept: 'application/json' }
          });
        }

        launchConfetti();
        setTimeout(function () {
          resetApp();
        }, 3000);
      });
    }

    if (backHomeButton) {
      backHomeButton.addEventListener('click', resetApp);
    }

    if (checkoutForm) {
      checkoutForm.addEventListener('submit', function (event) {
        event.preventDefault();

        var originalText = checkoutButton ? checkoutButton.innerHTML : '';
        if (checkoutButton) {
          checkoutButton.classList.add('is-loading');
          checkoutButton.disabled = true;
          checkoutButton.innerHTML = '<span class="btn-label">Sending…</span><i class="fa-solid fa-spinner fa-spin"></i>';
        }

        vibrate(50);

        var formData = new FormData(checkoutForm);
        formData.set('cart', JSON.stringify(cart));
        formData.set('special_requests', specialRequestsInput ? specialRequestsInput.value : '');

        if (checkoutForm.action) {
          fetch(checkoutForm.action, {
            method: 'POST',
            body: formData,
            headers: { Accept: 'application/json' }
          });
        }

        safeSetStorage(reviewStateKey, JSON.stringify({ scheduledAt: Date.now() }));

        window.setTimeout(function () {
          if (homeScreen) {
            homeScreen.classList.remove('active');
            homeScreen.setAttribute('aria-hidden', 'true');
          }

          if (cartScreen) {
            cartScreen.classList.remove('open');
            cartScreen.setAttribute('aria-hidden', 'true');
          }

          if (paymentScreen) {
            paymentScreen.classList.add('active');
            paymentScreen.setAttribute('aria-hidden', 'false');
          }

          if (trackingScreen) {
            trackingScreen.classList.remove('active');
            trackingScreen.setAttribute('aria-hidden', 'true');
          }

          if (checkoutButton) {
            checkoutButton.classList.remove('is-loading');
            checkoutButton.disabled = false;
            checkoutButton.innerHTML = originalText;
          }

          startFaceCardFlow();
        }, 1000);
      });
    }
  }

  function initializeApp() {
    filterCards('instant');

    var pendingReviewData = safeParseStorage(reviewStateKey);
    if (pendingReviewData && pendingReviewData.scheduledAt) {
      var remainingDelay = Math.max(0, reviewDelayMs - (Date.now() - pendingReviewData.scheduledAt));
      queueReviewPrompt(remainingDelay || reviewDelayMs);
    }

    setTimeout(function () {
      if (splashScreen) {
        splashScreen.classList.add('fade-out');
      }
    }, 2500);
  }

  window.addEventListener('DOMContentLoaded', function () {
    try {
      initializeInteractions();
      initializeApp();
    } catch (error) {
      logError(error);
    }
  });

  window.setTimeout(function () {
    try {
      if (splashScreen) {
        splashScreen.classList.add('fade-out');
      }

      if (homeScreen) {
        homeScreen.classList.add('active');
        homeScreen.setAttribute('aria-hidden', 'false');
      }

      if (trackingScreen) {
        trackingScreen.classList.remove('active');
        trackingScreen.setAttribute('aria-hidden', 'true');
      }

      if (paymentScreen) {
        paymentScreen.classList.remove('active');
        paymentScreen.setAttribute('aria-hidden', 'true');
      }

      if (cartScreen) {
        cartScreen.classList.remove('open');
        cartScreen.setAttribute('aria-hidden', 'true');
      }
    } catch (error) {
      logError(error);
    }
  }, 3000);
})();
