"use strict";

const FORM_ENDPOINT = "https://formspree.io/f/REPLACE_WITH_YOUR_FORM_ID";
const THEME_STORAGE_KEY = "welyd-theme";
let savedTheme = "light";

try {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "dark" || storedTheme === "light") savedTheme = storedTheme;
} catch (error) {
  console.warn("Could not read the saved theme preference.", error);
}

document.documentElement.dataset.theme = savedTheme;

const migrateMerchCartItem = (item) => {
  const wordedHoodieColors = {
    Beige: "Beige - Less is More",
    White: "White - Essentials Only",
    Blue: "Sky Blue - Essentials Only",
    Turquoise: "Turquoise - Essentials Only"
  };
  if (item.id === "hoodie" && Object.hasOwn(wordedHoodieColors, item.color)) {
    return { ...item, id: "hoodie-words", color: wordedHoodieColors[item.color] };
  }
  if (item.id === "cap" && (item.color === "Blue" || item.color === "Light Blue")) {
    return { ...item, id: "cap-words" };
  }
  return item;
};

document.addEventListener("DOMContentLoaded", () => {
  const loadingScreen = document.querySelector(".loading-screen");
  if (loadingScreen) {
    const loadingProgress = loadingScreen.querySelector(".loading-progress");
    const startedAt = performance.now();
    const loadingDuration = 1000;
    document.documentElement.classList.add("is-loading");

    const progressInterval = window.setInterval(() => {
      const progress = Math.min(Math.round(((performance.now() - startedAt) / loadingDuration) * 100), 100);
      loadingProgress?.setAttribute("aria-valuenow", String(progress));
    }, 50);

    window.setTimeout(() => {
      window.clearInterval(progressInterval);
      loadingProgress?.setAttribute("aria-valuenow", "100");
      document.documentElement.classList.remove("is-loading");
      loadingScreen.classList.add("is-hidden");
      window.setTimeout(() => loadingScreen.remove(), 350);
    }, loadingDuration);
  }

  const rotatingHeadline = document.querySelector(".hero-rotating-text");
  if (rotatingHeadline && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const phrases = ["easy to find.", "easy to trust.", "ready to grow."];
    let phraseIndex = 0;
    let characterIndex = phrases[phraseIndex].length;
    let deleting = true;

    const animateHeadline = () => {
      const phrase = phrases[phraseIndex];
      characterIndex += deleting ? -1 : 1;
      rotatingHeadline.textContent = phrase.slice(0, characterIndex);

      if (characterIndex === phrase.length) {
        deleting = true;
        window.setTimeout(animateHeadline, 1800);
      } else if (characterIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        window.setTimeout(animateHeadline, 300);
      } else {
        window.setTimeout(animateHeadline, deleting ? 45 : 75);
      }
    };

    window.setTimeout(animateHeadline, 1800);
  }

  const merchStore = document.querySelector(".merch-store");
  if (merchStore) {
    const storageKey = "welyd-merch-cart";
    const productCards = [...merchStore.querySelectorAll(".merch-product-card")];
    const products = new Map(productCards.map((card) => [card.dataset.productId, {
      id: card.dataset.productId,
      name: card.dataset.name,
      description: card.dataset.description,
      price: Number(card.dataset.price),
      image: card.dataset.image,
      colorImages: Object.fromEntries([...card.querySelectorAll(".merch-color option")].map((option) => [
        option.value,
        { src: option.dataset.image, alt: option.dataset.alt }
      ])),
      clothing: card.dataset.clothing === "true"
    }]));
    const sizeOptions = ["S", "M", "L", "XL", "XXL"];
    let cart = [];
    let cartNeedsSave = false;
    try {
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (!Array.isArray(parsedCart)) throw new Error("Saved merchandise cart is not a list.");
        cart = parsedCart.map(migrateMerchCartItem).filter((item) => {
          const product = products.get(item.id);
          const validSize = product && (product.clothing ? sizeOptions.includes(item.size) : item.size === "One size");
          return validSize && product.colorImages[item.color] && Number.isSafeInteger(item.quantity) && item.quantity > 0;
        }).map((item) => ({ id: item.id, color: item.color, size: item.size, quantity: Math.min(item.quantity, 99) }));
        cartNeedsSave = JSON.stringify(cart) !== savedCart;
      }
    } catch (error) {
      console.warn("Could not read the saved merchandise cart.", error);
    }

    const saveCart = () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(cart));
      } catch (error) {
        console.warn("Could not save the merchandise cart in this browser.", error);
      }
    };
    if (cartNeedsSave) saveCart();
    const formatPrice = (amount) => `KSh ${new Intl.NumberFormat("en-KE").format(amount)}`;
    const cartList = merchStore.querySelector("[data-cart-items]");
    const emptyMessage = merchStore.querySelector("[data-cart-empty]");
    const subtotalLabel = merchStore.querySelector("[data-cart-subtotal]");
    const cartStatus = merchStore.querySelector("[data-cart-status]");
    const checkoutList = merchStore.querySelector("[data-checkout-items]");
    const checkoutEmpty = merchStore.querySelector("[data-checkout-empty]");
    const checkoutSubtotal = merchStore.querySelector("[data-checkout-subtotal]");

    const addToCart = (product, color, size) => {
      const item = cart.find((entry) => entry.id === product.id && entry.color === color && entry.size === size);
      if (item) item.quantity = Math.min(item.quantity + 1, 99);
      else cart.push({ id: product.id, color, size, quantity: 1 });
      saveCart();
      renderCart();
      cartStatus.textContent = `${product.name}, ${color}${product.clothing ? `, size ${size},` : ","} added to your bag.`;
    };

    const renderCart = () => {
      cartList.replaceChildren();
      const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
      const subtotal = cart.reduce((total, item) => total + products.get(item.id).price * item.quantity, 0);
      merchStore.querySelectorAll("[data-cart-count]").forEach((counter) => {
        counter.textContent = String(itemCount);
      });
      subtotalLabel.textContent = formatPrice(subtotal);
      emptyMessage.hidden = cart.length > 0;

      cart.forEach((item) => {
        const product = products.get(item.id);
        const row = document.createElement("li");
        row.className = "cart-item";
        const image = document.createElement("img");
        image.src = product.colorImages[item.color].src;
        image.alt = "";
        image.setAttribute("aria-hidden", "true");
        const main = document.createElement("div");
        main.className = "cart-item-main";
        const name = document.createElement("span");
        name.className = "cart-item-name";
        name.textContent = product.name;
        const variant = document.createElement("span");
        variant.className = "cart-item-variant";
        variant.textContent = `${item.color}${product.clothing ? ` · Size: ${item.size}` : ""}`;
        const controls = document.createElement("div");
        controls.className = "cart-item-controls";
        const decrease = document.createElement("button");
        decrease.className = "cart-quantity-button";
        decrease.type = "button";
        decrease.dataset.cartAction = "decrease";
        decrease.dataset.cartKey = `${item.id}::${item.color}::${item.size}`;
        decrease.setAttribute("aria-label", `Remove one ${product.name} from bag`);
        decrease.textContent = "−";
        const quantity = document.createElement("span");
        quantity.className = "cart-quantity";
        quantity.textContent = String(item.quantity);
        const increase = document.createElement("button");
        increase.className = "cart-quantity-button";
        increase.type = "button";
        increase.dataset.cartAction = "increase";
        increase.dataset.cartKey = `${item.id}::${item.color}::${item.size}`;
        increase.setAttribute("aria-label", `Add one ${product.name} to bag`);
        increase.textContent = "+";
        const price = document.createElement("span");
        price.className = "cart-item-price";
        price.textContent = formatPrice(product.price * item.quantity);
        controls.append(decrease, quantity, increase);
        main.append(name, variant, controls);
        row.append(image, main, price);
        cartList.append(row);
      });

      if (checkoutList && checkoutEmpty && checkoutSubtotal) {
        checkoutList.replaceChildren();
        checkoutEmpty.hidden = cart.length > 0;
        checkoutSubtotal.textContent = formatPrice(subtotal);
        cart.forEach((item) => {
          const product = products.get(item.id);
          const row = document.createElement("li");
          row.className = "checkout-item";
          const description = document.createElement("span");
          description.textContent = `${product.name} · ${item.color}${product.clothing ? ` · ${item.size}` : ""} · Qty ${item.quantity}`;
          const price = document.createElement("strong");
          price.textContent = formatPrice(product.price * item.quantity);
          row.append(description, price);
          checkoutList.append(row);
        });
      }
    };
    renderCart();

    productCards.forEach((card) => {
      const colorSelect = card.querySelector(".merch-color");
      if (!colorSelect) return;
      colorSelect.addEventListener("change", () => {
        const selected = colorSelect.selectedOptions[0];
        const image = card.querySelector(".merch-product-image img");
        image.src = selected.dataset.image;
        image.alt = selected.dataset.alt;
      });
    });

    merchStore.querySelectorAll("[data-merch-filter]").forEach((filter) => {
      filter.addEventListener("click", () => {
        const category = filter.dataset.merchFilter;
        merchStore.querySelectorAll("[data-merch-filter]").forEach((button) => {
          const selected = button === filter;
          button.classList.toggle("is-active", selected);
          button.setAttribute("aria-pressed", String(selected));
        });
        productCards.forEach((card) => {
          card.hidden = category !== "all" && card.dataset.category !== category;
        });
      });
    });

    merchStore.querySelectorAll("[data-add-product]").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest(".merch-product-card");
        const product = products.get(card.dataset.productId);
        const color = card.querySelector(".merch-color").value;
        const sizeSelect = card.querySelector(".merch-size-choice");
        const size = product.clothing ? sizeSelect.value : "One size";
        if (!size) {
          cartStatus.textContent = "Choose a size before adding this item.";
          sizeSelect.focus();
          return;
        }
        addToCart(product, color, size);
      });
    });

    const previewDialog = merchStore.querySelector(".merch-preview-dialog");
    if (previewDialog) {
      const previewImage = previewDialog.querySelector("[data-preview-image]");
      const previewTitle = previewDialog.querySelector("[data-preview-title]");
      const previewPrice = previewDialog.querySelector("[data-preview-price]");
      const previewDescription = previewDialog.querySelector("[data-preview-description]");
      const previewColorLabel = previewDialog.querySelector("[data-preview-color-label]");
      const previewColor = previewDialog.querySelector("[data-preview-color]");
      const previewSizeLabel = previewDialog.querySelector("[data-preview-size-label]");
      const previewSize = previewDialog.querySelector("[data-preview-size]");
      const previewOneSize = previewDialog.querySelector("[data-preview-one-size]");
      const previewStatus = previewDialog.querySelector("[data-preview-status]");
      let previewProduct = null;

      merchStore.querySelectorAll("[data-preview-product]").forEach((button) => {
        button.addEventListener("click", () => {
          const card = button.closest(".merch-product-card");
          previewProduct = products.get(card.dataset.productId);
          const colorSelect = card.querySelector(".merch-color");
          const selectedColor = colorSelect.value;
          previewColor.replaceChildren();
          Object.entries(previewProduct.colorImages).forEach(([color, image]) => {
            const option = document.createElement("option");
            option.value = color;
            option.textContent = color;
            option.selected = color === selectedColor;
            previewColor.append(option);
          });
          previewColorLabel.hidden = Object.keys(previewProduct.colorImages).length < 2;
          previewColor.hidden = previewColorLabel.hidden;
          previewImage.src = previewProduct.colorImages[selectedColor].src;
          previewImage.alt = previewProduct.colorImages[selectedColor].alt;
          previewTitle.textContent = previewProduct.name;
          previewPrice.textContent = formatPrice(previewProduct.price);
          previewDescription.textContent = previewProduct.description;
          previewStatus.textContent = "";
          previewSize.replaceChildren();
          previewSizeLabel.hidden = !previewProduct.clothing;
          previewSize.hidden = !previewProduct.clothing;
          previewOneSize.hidden = previewProduct.clothing;
          if (previewProduct.clothing) {
            const prompt = document.createElement("option");
            prompt.value = "";
            prompt.textContent = "Choose a size";
            previewSize.append(prompt);
            sizeOptions.forEach((size) => {
              const option = document.createElement("option");
              option.value = size;
              option.textContent = size;
              previewSize.append(option);
            });
          }
          previewDialog.showModal();
        });
      });

      previewColor.addEventListener("change", () => {
        const image = previewProduct.colorImages[previewColor.value];
        previewImage.src = image.src;
        previewImage.alt = image.alt;
      });
      previewDialog.querySelector("[data-preview-close]").addEventListener("click", () => previewDialog.close());
      previewDialog.addEventListener("click", (event) => {
        if (event.target === previewDialog) previewDialog.close();
      });
      previewDialog.querySelector("[data-preview-add]").addEventListener("click", () => {
        if (!previewProduct) return;
        const size = previewProduct.clothing ? previewSize.value : "One size";
        if (!size) {
          previewStatus.textContent = "Choose a size before adding this item.";
          previewSize.focus();
          return;
        }
        addToCart(previewProduct, previewColor.value, size);
        previewStatus.textContent = "Added to your bag.";
      });
    }

    cartList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-cart-action]");
      if (!button) return;
      const [id, color, size] = button.dataset.cartKey.split("::");
      const item = cart.find((entry) => entry.id === id && entry.color === color && entry.size === size);
      if (!item) return;
      if (button.dataset.cartAction === "increase") item.quantity = Math.min(item.quantity + 1, 99);
      else if (button.dataset.cartAction === "decrease") {
        if (item.quantity <= 1) cart = cart.filter((entry) => entry !== item);
        else item.quantity -= 1;
      }
      saveCart();
      renderCart();
      cartStatus.textContent = "Your bag has been updated.";
    });

    merchStore.querySelector("[data-cart-clear]").addEventListener("click", () => {
      cart = [];
      saveCart();
      renderCart();
      cartStatus.textContent = "Your bag is empty.";
    });

    const cartDialog = merchStore.querySelector("#merch-cart");
    merchStore.querySelector("[data-cart-toggle]").addEventListener("click", () => {
      if (!cartDialog.open) {
        const cartButton = merchStore.querySelector("[data-cart-toggle]");
        const buttonRect = cartButton.getBoundingClientRect();
        cartDialog.style.setProperty("--cart-top", `${Math.max(12, buttonRect.bottom + 8)}px`);
        cartDialog.style.setProperty("--cart-right", `${Math.max(12, window.innerWidth - buttonRect.right)}px`);
        cartDialog.showModal();
      }
    });
    cartDialog.querySelector("[data-cart-close]").addEventListener("click", () => cartDialog.close());
    cartDialog.addEventListener("click", (event) => {
      if (event.target === cartDialog) cartDialog.close();
    });
  }

  const deliveryCheckoutForm = document.querySelector("#delivery-checkout-form");
  if (deliveryCheckoutForm) {
    const catalog = {
      hoodie: { name: "Welyd Logo-Only Hoodie", price: 4800, clothing: true, colors: { Cream: "images/optimized/merchandise/hoodie-cream.jpg", Black: "images/optimized/merchandise/hoodie-black.jpg", Lavender: "images/optimized/merchandise/hoodie-lavender.jpg", "Sky Blue": "images/optimized/merchandise/hoodie-sky-blue.jpg" } },
      "hoodie-words": { name: "Welyd Worded Hoodie", price: 4800, clothing: true, colors: { "Beige - Less is More": "images/optimized/merchandise/hoodie-words-beige-less-is-more.jpg", "Light Blue - Less is More": "images/optimized/merchandise/hoodie-words-light-blue-less-is-more.jpg", "Lavender - Less is More": "images/optimized/merchandise/hoodie-words-lavender-less-is-more.jpg", "Black - Less is More": "images/optimized/merchandise/hoodie-words-black-less-is-more.jpg", "Lavender - Essentials Only": "images/optimized/merchandise/hoodie-words-lavender-essentials.jpg", "Cream - Essentials Only": "images/optimized/merchandise/hoodie-words-cream-essentials.jpg", "White - Essentials Only": "images/optimized/merchandise/hoodie-words-white-essentials.jpg", "Black - Essentials Only": "images/optimized/merchandise/hoodie-words-black-essentials.jpg", "Turquoise - Essentials Only": "images/optimized/merchandise/hoodie-words-turquoise-essentials.jpg", "Sky Blue - Essentials Only": "images/optimized/merchandise/hoodie-words-sky-blue-essentials.jpg" } },
      tshirt: { name: "Welyd Essential T-Shirt", price: 2000, clothing: true, colors: { Black: "images/optimized/merchandise/tshirt-black.jpg", Orange: "images/optimized/merchandise/tshirt-orange.jpg" } },
      polo: { name: "Welyd Logo Polo", price: 3500, clothing: true, colors: { Cream: "images/optimized/merchandise/polo-cream.jpg" } },
      cap: { name: "Welyd Logo-Only Cap", price: 1500, clothing: false, colors: { Yellow: "images/optimized/merchandise/cap-yellow.jpg", "Light Blue": "images/optimized/merchandise/cap-light-blue-logo.jpg", Lavender: "images/optimized/merchandise/cap-lavender.jpg", Beige: "images/optimized/merchandise/cap-beige.jpg", Black: "images/optimized/merchandise/cap-black.jpg", White: "images/optimized/merchandise/cap-white.jpg", Pink: "images/optimized/merchandise/cap-pink.jpg" } },
      "cap-words": { name: "Welyd Worded Cap", price: 1500, clothing: false, colors: { Blue: "images/optimized/merchandise/cap-blue.jpg", "Light Blue": "images/optimized/merchandise/cap-light-blue.jpg" } },
      bottle: { name: "Welyd Water Bottle", price: 1800, clothing: false, colors: { Black: "images/optimized/merchandise/water-bottle-black.jpg", White: "images/optimized/merchandise/water-bottle-white.jpg" } },
      "stainless-bottle": { name: "Welyd Stainless Steel Bottle", price: 2800, clothing: false, colors: { White: "images/optimized/merchandise/stainless-bottle-white.jpg" } },
      beanie: { name: "Welyd Beanie", price: 1600, clothing: false, colors: { Blue: "images/optimized/merchandise/beanie-blue.jpg", "Light Blue": "images/optimized/merchandise/beanie-light-blue.jpg", White: "images/optimized/merchandise/beanie-white.jpg", Black: "images/optimized/merchandise/beanie-black.jpg", Gray: "images/optimized/merchandise/beanie-gray.jpg", Green: "images/optimized/merchandise/beanie-green.jpg", Pink: "images/optimized/merchandise/beanie-pink.jpg" } }
    };
    const sizeOptions = ["S", "M", "L", "XL", "XXL"];
    const itemsList = document.querySelector("[data-delivery-items]");
    const emptyMessage = document.querySelector("[data-delivery-empty]");
    const subtotalLabel = document.querySelector("[data-delivery-subtotal]");
    const status = deliveryCheckoutForm.querySelector("[data-delivery-status]");
    const submitButton = deliveryCheckoutForm.querySelector("[data-delivery-submit]");
    const result = deliveryCheckoutForm.querySelector("[data-delivery-result]");
    const emailLink = deliveryCheckoutForm.querySelector("[data-delivery-email]");
    const fulfilment = deliveryCheckoutForm.querySelector("#delivery-method");
    const addressFields = [...deliveryCheckoutForm.querySelectorAll("#delivery-county, #delivery-area, #delivery-address")];
    const addressSections = [...deliveryCheckoutForm.querySelectorAll(".delivery-address-field")];
    let orderItems = [];
    let cartReadError = false;

    const formatPrice = (amount) => `KSh ${new Intl.NumberFormat("en-KE").format(amount)}`;
    try {
      const savedCart = localStorage.getItem("welyd-merch-cart");
      const parsedCart = savedCart ? JSON.parse(savedCart) : [];
      if (!Array.isArray(parsedCart)) throw new Error("Saved merchandise bag is not a list.");
      orderItems = parsedCart.map(migrateMerchCartItem).filter((item) => {
        const product = catalog[item.id];
        const validSize = product && (product.clothing ? sizeOptions.includes(item.size) : item.size === "One size");
        return validSize && Object.hasOwn(product.colors, item.color) && Number.isSafeInteger(item.quantity) && item.quantity > 0;
      }).map((item) => ({ ...item, quantity: Math.min(item.quantity, 99) }));
    } catch (error) {
      cartReadError = true;
      console.warn("Could not read the merchandise bag for checkout.", error);
    }

    const subtotal = orderItems.reduce((sum, item) => sum + catalog[item.id].price * item.quantity, 0);
    orderItems.forEach((item) => {
      const product = catalog[item.id];
      const row = document.createElement("li");
      row.className = "delivery-item";
      const image = document.createElement("img");
      image.className = "delivery-item-image";
      image.src = product.colors[item.color];
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      const details = document.createElement("div");
      const name = document.createElement("strong");
      name.textContent = product.name;
      const variant = document.createElement("span");
      variant.textContent = `${item.color}${product.clothing ? ` · Size ${item.size}` : ""} · Qty ${item.quantity}`;
      const price = document.createElement("strong");
      price.textContent = formatPrice(product.price * item.quantity);
      details.append(name, variant);
      row.append(image, details, price);
      itemsList.append(row);
    });
    emptyMessage.hidden = orderItems.length > 0;
    subtotalLabel.textContent = formatPrice(subtotal);
    submitButton.disabled = orderItems.length === 0;
    if (cartReadError) {
      status.className = "form-status error";
      status.textContent = "We couldn't read your saved bag. Return to the collection, refresh the page, and try again.";
    } else if (!orderItems.length) {
      status.className = "form-status info";
      status.textContent = "Add at least one item to your bag before entering delivery details.";
    }

    const updateAddressRequirements = () => {
      const needsAddress = fulfilment.value === "Deliver to my address";
      addressFields.forEach((field) => {
        field.required = needsAddress;
      });
      addressSections.forEach((section) => {
        section.hidden = !needsAddress;
      });
    };
    fulfilment.addEventListener("change", updateAddressRequirements);
    updateAddressRequirements();

    deliveryCheckoutForm.addEventListener("submit", (event) => {
      event.preventDefault();
      updateAddressRequirements();
      if (!orderItems.length) {
        status.className = "form-status error";
        status.textContent = "Your bag is empty. Add merchandise before preparing a delivery request.";
        return;
      }
      if (!deliveryCheckoutForm.reportValidity()) return;

      const data = new FormData(deliveryCheckoutForm);
      const orderLines = orderItems.map((item) => {
        const product = catalog[item.id];
        return `${product.name} - ${item.color}${product.clothing ? `, size ${item.size}` : ""}, quantity ${item.quantity}: ${formatPrice(product.price * item.quantity)}`;
      });
      const deliveryDetails = data.get("fulfilment") === "Deliver to my address"
        ? [
          `County or town: ${data.get("county")}`,
          `Area or neighbourhood: ${data.get("area")}`,
          `Street/building/address: ${data.get("address")}`,
          `Postal code: ${data.get("postal_code") || "Not provided"}`,
          `Directions/delivery notes: ${data.get("directions") || "None"}`
        ]
        : ["The customer would like to discuss collection or pickup."];
      const body = [
        `Name: ${data.get("name")}`,
        `Email: ${data.get("email")}`,
        `Phone or WhatsApp: ${data.get("phone")}`,
        `Preferred fulfilment: ${data.get("fulfilment")}`,
        ...deliveryDetails,
        `Other order notes: ${data.get("notes") || "None"}`,
        "",
        "Requested items:",
        ...orderLines,
        `Merchandise subtotal: ${formatPrice(subtotal)}`,
        "Delivery charge: To be confirmed",
        "",
        "Please confirm stock, total cost, delivery, and payment arrangements before treating this as an order."
      ];
      const subject = `Welyd Merchandise delivery request - ${data.get("name")}`;
      emailLink.href = `mailto:hello@welydnetworks.co.ke?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.join("\n"))}`;
      result.hidden = false;
      status.className = "form-status info";
      status.textContent = "Your request is ready. Review the delivery details and merchandise summary in your email app; nothing is sent until you send that email.";
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
      emailLink.focus({ preventScroll: true });
    });
  }

  const floatingActions = document.querySelector(".floating-actions");
  if (floatingActions) {
    const themeButton = document.createElement("button");
    const themeIcon = document.createElement("span");
    themeButton.className = "float-btn theme-toggle";
    themeButton.type = "button";
    themeButton.setAttribute("aria-pressed", String(savedTheme === "dark"));
    themeIcon.setAttribute("aria-hidden", "true");
    themeButton.append(themeIcon);
    floatingActions.prepend(themeButton);

    const updateThemeButton = () => {
      const isDark = document.documentElement.dataset.theme === "dark";
      themeButton.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
      themeButton.title = `Switch to ${isDark ? "light" : "dark"} theme`;
      themeButton.setAttribute("aria-pressed", String(isDark));
      themeIcon.textContent = isDark ? "☀" : "☾";
    };
    updateThemeButton();

    themeButton.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = nextTheme;
      savedTheme = nextTheme;
      updateThemeButton();
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch (error) {
        console.warn("Could not save the theme preference.", error);
      }
    });
  }

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const menuButton = document.querySelector(".menu-toggle");
  const navWrap = document.querySelector(".nav-wrap");

  if (menuButton && navWrap) {
    const closeMenu = () => {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation menu");
      navWrap.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      navWrap.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
        dropdown.classList.remove("is-open");
        dropdown.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", "false");
      });
    };
    menuButton.addEventListener("click", () => {
      const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
      menuButton.setAttribute("aria-expanded", String(willOpen));
      menuButton.setAttribute("aria-label", willOpen ? "Close navigation menu" : "Open navigation menu");
      navWrap.classList.toggle("is-open", willOpen);
      document.body.classList.toggle("menu-open", willOpen);
    });
    navWrap.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        closeMenu();
        menuButton.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".site-header")) closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1100) closeMenu();
    });
  }

  document.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
    const toggle = dropdown.querySelector(".nav-dropdown-toggle");
    if (!toggle) return;
    const closeDropdown = () => {
      dropdown.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    const openDropdown = () => {
      dropdown.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    };
    toggle.addEventListener("click", (event) => {
      const isHoverPointer = event.detail > 0
        && window.matchMedia("(hover: hover) and (min-width: 1101px)").matches;
      const willOpen = isHoverPointer || toggle.getAttribute("aria-expanded") !== "true";
      if (willOpen) openDropdown();
      else closeDropdown();
    });
    dropdown.addEventListener("mouseenter", () => {
      if (window.matchMedia("(hover: hover) and (min-width: 1101px)").matches) openDropdown();
    });
    dropdown.addEventListener("mouseleave", () => {
      if (window.matchMedia("(hover: hover) and (min-width: 1101px)").matches) closeDropdown();
    });
    document.addEventListener("click", (event) => {
      if (!dropdown.contains(event.target)) closeDropdown();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        closeDropdown();
        toggle.focus();
      }
    });
    dropdown.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeDropdown));
  });

  const eventIndustry = document.querySelector("#event-industry");
  const eventPurpose = document.querySelector("#event-purpose");
  const eventCards = [...document.querySelectorAll(".event-card")];
  if (eventIndustry && eventPurpose && eventCards.length) {
    const resultCount = document.querySelector(".event-results");
    const emptyState = document.querySelector(".events-empty");
    const updateEvents = () => {
      const industry = eventIndustry.value;
      const purpose = eventPurpose.value;
      let visibleCount = 0;
      eventCards.forEach((card) => {
        const matches = (industry === "all" || card.dataset.industry === industry)
          && (purpose === "all" || card.dataset.purpose === purpose);
        card.hidden = !matches;
        if (matches) visibleCount += 1;
      });
      if (resultCount) {
        resultCount.textContent = `Showing ${visibleCount} of ${eventCards.length} illustrative event ideas`;
      }
      if (emptyState) emptyState.hidden = visibleCount > 0;
    };
    eventIndustry.addEventListener("change", updateEvents);
    eventPurpose.addEventListener("change", updateEvents);
    document.querySelector("[data-event-reset]")?.addEventListener("click", () => {
      eventIndustry.value = "all";
      eventPurpose.value = "all";
      updateEvents();
      eventIndustry.focus();
    });
  }

  const projectProgressContent = document.querySelector("#project-progress-content");
  const projectMilestones = document.querySelector("#project-milestones");
  const demoProjectSelect = document.querySelector("#demo-project");
  if (projectProgressContent && projectMilestones && demoProjectSelect) {
    const projectPassword = "12345";
    const accessGate = document.querySelector("#project-access-gate");
    const passwordForm = document.querySelector("#project-password-form");
    const passwordInput = document.querySelector("#project-password");
    const passwordStatus = document.querySelector("#project-password-status");
    const projectLoadingScreen = document.querySelector("#project-loading-screen");
    const gateTitle = document.querySelector("#project-gate-title");
    const lockButton = document.querySelector("#project-lock-button");
    const workspaceTag = document.querySelector("#workspace-tag");
    const storageKey = "welyd-interior-design-project-v1";
    const sampleProjects = {
      "brand-identity": {
        title: "Brand identity project",
        description: "A sample view of the stages and deliverables in a brand identity collaboration.",
        update: "Example update: visual directions are being prepared for review.",
        currentStage: "Visual concepts",
        footer: "In a live client portal, agreed scopes, dates, feedback, and approvals would be updated by the project team.",
        milestones: [
          ["Discovery & kickoff", "Goals, audience, and project requirements agreed together.", "Approved project brief", "complete"],
          ["Brand strategy", "Positioning and creative direction aligned to the business.", "Strategy and direction", "complete"],
          ["Visual concepts", "Initial identity concepts are being prepared for review.", "Brand concept presentation", "current"],
          ["Refinement & approval", "Feedback is applied to the selected direction before approval.", "Approved identity artwork", "upcoming"],
          ["Files & handover", "Final files and practical usage guidance are prepared for handover.", "Final brand asset package", "upcoming"]
        ]
      },
      "business-website": {
        title: "Business website project",
        description: "A sample website build showing checkpoints from discovery through launch handover.",
        update: "Example update: the first website build is ready for content and layout review.",
        currentStage: "Development & review",
        footer: "In a live client portal, agreed scopes, dates, feedback, and approvals would be updated by the project team.",
        milestones: [
          ["Discovery & scope", "Audience, site goals, key pages, and requirements agreed.", "Approved website brief", "complete"],
          ["Structure & content", "Page hierarchy and content requirements mapped for review.", "Sitemap and content plan", "complete"],
          ["Design direction", "Visual layout direction reviewed and approved for the build.", "Approved page designs", "complete"],
          ["Development & review", "Website pages and agreed functionality assembled for testing.", "Preview website for feedback", "current"],
          ["Testing & handover", "Final checks, launch preparation, and administrator guidance.", "Live site and handover notes", "upcoming"]
        ]
      },
      "digital-marketing": {
        title: "Digital marketing project",
        description: "A sample campaign collaboration showing planning, execution, review, and recommendations.",
        update: "Example update: campaign priorities and audience segments are being aligned.",
        currentStage: "Strategy & plan",
        footer: "In a live client portal, agreed scopes, dates, feedback, and approvals would be updated by the project team.",
        milestones: [
          ["Kickoff & goals", "Business goals, audience, channels, and success measures discussed.", "Campaign brief", "complete"],
          ["Strategy & plan", "Channel approach, content direction, and activity schedule prepared.", "Campaign strategy and calendar", "current"],
          ["Creative & setup", "Campaign assets and tracking are prepared for approval.", "Approved campaign assets", "upcoming"],
          ["Campaign launch", "Approved activity is published and monitored against agreed measures.", "Live campaign activity", "upcoming"],
          ["Review & next steps", "Performance is reviewed and practical next steps are shared.", "Campaign summary and recommendations", "upcoming"]
        ]
      }
    };
    const interiorProjectValue = "interior-design-website";
    const interiorOnlyElements = [...document.querySelectorAll("[data-interior-project]")];
    let renderInteriorProject = () => {};
    const milestonePlan = [
      {
        id: "discovery",
        title: "Discovery & project brief",
        description: "Meet to understand the studio, ideal clients, services, goals, required pages, budget, and launch priorities.",
        deliverable: "Agreed project brief, scope, and content checklist",
        target: "Week 1 · Days 1–3",
        startDay: 1,
        endDay: 3
      },
      {
        id: "structure",
        title: "Sitemap, content & wireframes",
        description: "Plan the customer journey and page structure for the studio, services, portfolio, project stories, and enquiries.",
        deliverable: "Approved sitemap, wireframes, and content plan",
        target: "Week 1 · Days 2–7",
        startDay: 2,
        endDay: 7
      },
      {
        id: "design",
        title: "Visual design direction",
        description: "Create a polished visual direction that reflects the interior design studio and presents its work clearly across screen sizes.",
        deliverable: "Homepage and key-page design for client approval",
        target: "Week 2 · Days 8–14",
        startDay: 8,
        endDay: 14
      },
      {
        id: "build",
        title: "Responsive website build",
        description: "Build the approved pages, add agreed copy and project imagery, and configure enquiry pathways.",
        deliverable: "Working website preview on desktop and mobile",
        target: "Week 3 · Days 15–21",
        startDay: 15,
        endDay: 21
      },
      {
        id: "review",
        title: "Client review & refinements",
        description: "Review the preview together, collect one consolidated round of feedback, and make the agreed refinements.",
        deliverable: "Reviewed website and agreed final changes",
        target: "Week 4 · Days 22–26",
        startDay: 22,
        endDay: 26
      },
      {
        id: "launch",
        title: "Quality check, launch & handover",
        description: "Check links, forms, responsive layouts, and agreed launch details; publish and hand over the site.",
        deliverable: "Launched website and handover notes",
        target: "Week 4 · Days 27–30",
        startDay: 27,
        endDay: 30
      }
    ];
    const validStatuses = new Set(["upcoming", "current", "complete", "blocked"]);
    const statusLabels = {
      upcoming: "Upcoming",
      current: "In progress",
      complete: "Complete",
      blocked: "Needs attention"
    };
    const defaultState = () => ({
      version: 1,
      discoveryDate: "",
      milestones: milestonePlan.map(({ id }) => ({ id, status: "upcoming" })),
      updates: []
    });
    const saveStatus = document.querySelector("#project-save-status");
    let projectState = defaultState();

    try {
      const savedState = localStorage.getItem(storageKey);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        const isValidDate = !parsedState.discoveryDate || (
          /^\d{4}-\d{2}-\d{2}$/.test(parsedState.discoveryDate)
          && !Number.isNaN(Date.parse(`${parsedState.discoveryDate}T00:00:00.000Z`))
          && new Date(`${parsedState.discoveryDate}T00:00:00.000Z`).toISOString().slice(0, 10) === parsedState.discoveryDate
        );
        const validMilestones = Array.isArray(parsedState.milestones)
          && parsedState.milestones.length === milestonePlan.length
          && parsedState.milestones.every((item, index) => (
            item.id === milestonePlan[index].id && validStatuses.has(item.status)
          ));
        const validUpdates = Array.isArray(parsedState.updates)
          && parsedState.updates.length <= 500
          && parsedState.updates.every((item) => (
            (item.author === "Client" || item.author === "Welyd Networks")
            && typeof item.text === "string"
            && item.text.length > 0
            && item.text.length <= 1000
            && typeof item.createdAt === "string"
            && !Number.isNaN(Date.parse(item.createdAt))
          ));
        if (parsedState.version !== 1 || !isValidDate || !validMilestones || !validUpdates) {
          throw new Error("Saved project workspace has an invalid format.");
        }
        projectState = parsedState;
      }
    } catch (error) {
      console.warn("Could not load the saved project workspace.", error);
      saveStatus.textContent = "The saved project workspace could not be read. Your saved data has not been changed.";
      return;
    }

    const formatDate = (dateString) => {
      const [year, month, day] = dateString.split("-").map(Number);
      return new Intl.DateTimeFormat("en-KE", {
        day: "numeric",
        month: "short",
        timeZone: "UTC"
      }).format(new Date(Date.UTC(year, month - 1, day, 12)));
    };
    const addDays = (dateString, days) => {
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day + days, 12));
      return date.toISOString().slice(0, 10);
    };
    const formatTarget = (milestone) => {
      if (!projectState.discoveryDate) return `${milestone.target} · set discovery date for calendar dates`;
      const start = formatDate(addDays(projectState.discoveryDate, milestone.startDay));
      const end = formatDate(addDays(projectState.discoveryDate, milestone.endDay));
      return `${milestone.target} · ${start}–${end}`;
    };
    const persistProject = () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(projectState));
        saveStatus.textContent = "Saved in this browser.";
        return true;
      } catch (error) {
        console.warn("Could not save the project workspace.", error);
        saveStatus.textContent = "Could not save your changes in this browser. Check browser storage and try again.";
        return false;
      }
    };
    const getStatusClass = (status) => status === "upcoming" ? "" : `is-${status}`;
    const renderMilestones = () => {
      projectMilestones.replaceChildren(...milestonePlan.map((milestone, index) => {
        const status = projectState.milestones[index].status;
        const item = document.createElement("li");
        item.className = `project-milestone ${getStatusClass(status)}`.trim();
        const marker = document.createElement("span");
        marker.className = "milestone-marker";
        marker.setAttribute("aria-hidden", "true");
        marker.textContent = status === "complete" ? "✓" : String(index + 1);

        const copy = document.createElement("div");
        copy.className = "milestone-copy";
        const heading = document.createElement("div");
        heading.className = "milestone-heading";
        const title = document.createElement("h3");
        title.textContent = milestone.title;
        const statusText = document.createElement("span");
        statusText.className = "milestone-status";
        statusText.textContent = statusLabels[status];
        heading.append(title, statusText);

        const timing = document.createElement("span");
        timing.className = "milestone-timing";
        timing.textContent = formatTarget(milestone);
        const description = document.createElement("p");
        description.textContent = milestone.description;
        const deliverable = document.createElement("span");
        deliverable.className = "milestone-deliverable";
        const deliverableLabel = document.createElement("strong");
        deliverableLabel.textContent = "Deliverable: ";
        deliverable.append(deliverableLabel, document.createTextNode(milestone.deliverable));

        const controls = document.createElement("label");
        controls.className = "milestone-control";
        const controlLabel = document.createElement("span");
        controlLabel.textContent = "Update milestone status";
        const select = document.createElement("select");
        select.setAttribute("aria-label", `Status for ${milestone.title}`);
        select.dataset.milestoneStatus = milestone.id;
        Object.entries(statusLabels).forEach(([value, label]) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = label;
          select.append(option);
        });
        select.value = status;
        controls.append(controlLabel, select);
        copy.append(heading, timing, description, deliverable, controls);
        item.append(marker, copy);
        return item;
      }));
    };
    const renderProgressSummary = () => {
      const completed = projectState.milestones.filter(({ status }) => status === "complete").length;
      const percentage = Math.round((completed / milestonePlan.length) * 100);
      const progressBar = document.querySelector('[role="progressbar"][aria-label="Completed project milestones"]');
      progressBar.setAttribute("aria-valuenow", String(percentage));
      document.querySelector("#project-progress-fill").style.width = `${percentage}%`;
      document.querySelector("#project-progress-value").textContent = `${completed} of ${milestonePlan.length} milestones complete · ${percentage}%`;

      const current = projectState.milestones.findIndex(({ status }) => status === "current");
      const blocked = projectState.milestones.findIndex(({ status }) => status === "blocked");
      const upcoming = projectState.milestones.findIndex(({ status }) => status === "upcoming");
      let stage = "Complete";
      let update = "All milestones are marked complete. Review the project conversation for handover notes.";
      if (current >= 0) stage = milestonePlan[current].title;
      else if (blocked >= 0) stage = `Needs attention: ${milestonePlan[blocked].title}`;
      else if (upcoming >= 0 && !projectState.discoveryDate && upcoming === 0) stage = "Discovery meeting to be scheduled";
      else if (upcoming >= 0) stage = `Next: ${milestonePlan[upcoming].title}`;
      document.querySelector("#project-current-stage").textContent = stage;
      if (current >= 0) {
        update = `In progress: ${milestonePlan[current].title}. Target: ${formatTarget(milestonePlan[current])}.`;
      } else if (blocked >= 0) {
        update = `Needs attention: ${milestonePlan[blocked].title}. Add a note in the project conversation to agree the next step.`;
      } else if (upcoming === 0 && !projectState.discoveryDate) {
        update = "Next step: schedule the discovery meeting. We will confirm requirements, content, priorities, and the delivery plan together.";
      } else if (upcoming >= 0) {
        update = `Next up: ${milestonePlan[upcoming].title}. Target: ${formatTarget(milestonePlan[upcoming])}.`;
      }
      document.querySelector("#project-update").textContent = update;
    };
    const renderUpdates = () => {
      const updateList = document.querySelector("#project-update-list");
      if (projectState.updates.length === 0) {
        const emptyState = document.createElement("li");
        emptyState.className = "project-update-empty";
        emptyState.textContent = "No updates yet. Use this space to capture decisions, feedback, and questions after discovery.";
        updateList.replaceChildren(emptyState);
        return;
      }
      updateList.replaceChildren(...projectState.updates.map((update) => {
        const item = document.createElement("li");
        item.className = "project-update-entry";
        const heading = document.createElement("div");
        heading.className = "project-update-entry-heading";
        const author = document.createElement("strong");
        author.textContent = update.author;
        const date = document.createElement("time");
        date.dateTime = update.createdAt;
        date.textContent = new Intl.DateTimeFormat("en-KE", {
          dateStyle: "medium",
          timeStyle: "short"
        }).format(new Date(update.createdAt));
        const text = document.createElement("p");
        text.textContent = update.text;
        heading.append(author, date);
        item.append(heading, text);
        return item;
      }));
    };

    const renderSampleProject = (project) => {
      document.querySelector("#workspace-tag").textContent = "Sample workspace";
      document.querySelector("#project-title").textContent = project.title;
      document.querySelector("#project-description").textContent = project.description;
      document.querySelector("#project-current-stage").textContent = project.currentStage;
      document.querySelector("#project-update").textContent = project.update;
      document.querySelector("#workspace-footer-copy").textContent = project.footer;
      document.querySelector("#workspace-footer-link").textContent = "Discuss a project workspace →";
      const completed = project.milestones.filter(([, , , status]) => status === "complete").length;
      const progress = Math.round((completed / project.milestones.length) * 100);
      document.querySelector("#project-progress-value").textContent = `${progress}% of milestones complete`;
      document.querySelector("#project-progress-fill").style.width = `${progress}%`;
      const progressBar = document.querySelector('[role="progressbar"][aria-label="Completed project milestones"]');
      progressBar.setAttribute("aria-valuenow", String(progress));
      projectMilestones.replaceChildren(...project.milestones.map(([titleText, descriptionText, deliverableText, status], index) => {
        const item = document.createElement("li");
        item.className = `project-milestone ${status === "upcoming" ? "" : `is-${status}`}`.trim();
        const marker = document.createElement("span");
        marker.className = "milestone-marker";
        marker.setAttribute("aria-hidden", "true");
        marker.textContent = status === "complete" ? "✓" : String(index + 1);
        const copy = document.createElement("div");
        copy.className = "milestone-copy";
        const heading = document.createElement("div");
        heading.className = "milestone-heading";
        const title = document.createElement("h3");
        title.textContent = titleText;
        const milestoneStatus = document.createElement("span");
        milestoneStatus.className = "milestone-status";
        milestoneStatus.textContent = status === "current" ? "In progress" : status === "complete" ? "Complete" : "Upcoming";
        heading.append(title, milestoneStatus);
        const description = document.createElement("p");
        description.textContent = descriptionText;
        const deliverable = document.createElement("span");
        deliverable.className = "milestone-deliverable";
        const label = document.createElement("strong");
        label.textContent = "Deliverable: ";
        deliverable.append(label, document.createTextNode(deliverableText));
        copy.append(heading, description, deliverable);
        item.append(marker, copy);
        return item;
      }));
      interiorOnlyElements.forEach((element) => { element.hidden = true; });
    };
    const renderSelectedProject = () => {
      if (demoProjectSelect.value === interiorProjectValue) {
        interiorOnlyElements.forEach((element) => { element.hidden = false; });
        renderInteriorProject();
        return;
      }
      const project = sampleProjects[demoProjectSelect.value];
      if (!project) {
        console.error("The selected sample project could not be found.");
        return;
      }
      renderSampleProject(project);
    };
    const lockSelectedProject = () => {
      projectLoadingScreen.hidden = true;
      projectProgressContent.hidden = true;
      accessGate.hidden = false;
      lockButton.hidden = true;
      workspaceTag.textContent = "Locked workspace";
      gateTitle.textContent = demoProjectSelect.selectedOptions[0]?.textContent || "Project workspace";
      passwordInput.value = "";
      passwordInput.setAttribute("aria-invalid", "false");
      passwordStatus.textContent = "";
      passwordStatus.classList.remove("is-error");
      passwordInput.disabled = false;
      passwordForm.querySelector('button[type="submit"]').disabled = false;
      demoProjectSelect.disabled = false;
    };

    const discoveryDate = document.querySelector("#discovery-date");
    discoveryDate.value = projectState.discoveryDate;
    discoveryDate.addEventListener("change", () => {
      const previousDate = projectState.discoveryDate;
      projectState.discoveryDate = discoveryDate.value;
      if (!persistProject()) {
        projectState.discoveryDate = previousDate;
        discoveryDate.value = previousDate;
        return;
      }
      renderMilestones();
      renderProgressSummary();
    });
    projectMilestones.addEventListener("change", (event) => {
      const select = event.target.closest("[data-milestone-status]");
      if (!select) return;
      const milestoneIndex = projectState.milestones.findIndex(({ id }) => id === select.dataset.milestoneStatus);
      if (milestoneIndex < 0) return;
      const previousMilestones = projectState.milestones.map((item) => ({ ...item }));
      const status = select.value;
      if (!validStatuses.has(status)) return;
      if (status === "current") {
        projectState.milestones.forEach((item, index) => {
          if (item.status === "current") item.status = "upcoming";
          if (index === milestoneIndex) item.status = status;
        });
      } else {
        projectState.milestones[milestoneIndex].status = status;
      }
      if (!persistProject()) {
        projectState.milestones = previousMilestones;
      }
      renderMilestones();
      renderProgressSummary();
    });
    document.querySelector("#project-update-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = document.querySelector("#project-update-input");
      const text = input.value.trim();
      if (!text) {
        input.setCustomValidity("Enter an update before posting.");
        input.reportValidity();
        input.setCustomValidity("");
        return;
      }
      const previousUpdates = projectState.updates;
      projectState.updates = [...previousUpdates, {
        author: document.querySelector("#update-author").value,
        text,
        createdAt: new Date().toISOString()
      }].slice(-500);
      if (persistProject()) {
        input.value = "";
        renderUpdates();
      } else {
        projectState.updates = previousUpdates;
      }
    });

    renderInteriorProject = () => {
      document.querySelector("#workspace-tag").textContent = "Interior Design Website Project";
      document.querySelector("#project-title").textContent = "Professional website for an interior design company";
      document.querySelector("#project-description").textContent = "Plan and build a refined, responsive website to showcase interior projects, explain services, and make it simple for prospective clients to enquire. Final scope and content will be agreed at discovery.";
      document.querySelector("#workspace-footer-copy").textContent = "Four-week estimate begins after discovery and depends on timely content, feedback, and approvals. Exact scope and dates will be agreed at the meeting.";
      document.querySelector("#workspace-footer-link").textContent = "Contact us about this project →";
      renderMilestones();
      renderProgressSummary();
      renderUpdates();
    };
    passwordForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (passwordInput.value !== projectPassword) {
        passwordInput.setAttribute("aria-invalid", "true");
        passwordStatus.textContent = "That password didn’t match. Please try again.";
        passwordStatus.classList.add("is-error");
        passwordInput.focus();
        return;
      }
      passwordInput.setAttribute("aria-invalid", "false");
      passwordStatus.textContent = "";
      passwordStatus.classList.remove("is-error");
      passwordInput.value = "";
      accessGate.hidden = true;
      projectLoadingScreen.hidden = false;
      passwordInput.disabled = true;
      passwordForm.querySelector('button[type="submit"]').disabled = true;
      demoProjectSelect.disabled = true;
      workspaceTag.textContent = "Loading project";
      window.setTimeout(() => {
        renderSelectedProject();
        projectLoadingScreen.hidden = true;
        projectProgressContent.hidden = false;
        lockButton.hidden = false;
        demoProjectSelect.disabled = false;
      }, 1000);
    });
    demoProjectSelect.addEventListener("change", () => {
      lockSelectedProject();
      passwordInput.focus();
    });
    lockButton.addEventListener("click", () => {
      lockSelectedProject();
      passwordInput.focus();
    });
    lockSelectedProject();
  }

  const topButton = document.querySelector(".float-btn.top");
  if (topButton) {
    const updateTopButton = () => topButton.classList.toggle("visible", window.scrollY > 420);
    window.addEventListener("scroll", updateTopButton, { passive: true });
    updateTopButton();
    topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  const revealItems = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("revealed"));
  }

  const counters = document.querySelectorAll("[data-count]");
  const countUp = (element) => {
    const target = Number(element.dataset.count);
    const suffix = element.dataset.suffix || "";
    const duration = 1100;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      element.textContent = `${Math.round(target * (1 - (1 - progress) ** 3))}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          countUp(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach((counter) => { counter.textContent = `${counter.dataset.count}${counter.dataset.suffix || ""}`; });
  }

  document.querySelectorAll(".faq-question").forEach((button) => {
    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
    });
  });

  const articles = {
    "wick-scents": {
      category: "Client Work",
      title: "Wick Scents",
      intro: "A brand identity project for a luxury candle company.",
      industry: "Luxury candles",
      service: "Brand identity",
      work: "Brand identity for a luxury candle company.",
      direction: "A warm, premium identity built around the atmosphere of candlelight and the ritual of slowing down.",
      highlights: ["Warm, ember-like colour", "Soft light and shadow", "A refined, memorable mark"],
      date: "June 2024"
    },
    "lee-fashions-ke": {
      category: "Client Work",
      title: "Lee Fashions Ke",
      intro: "A brand identity project for a fashion company.",
      industry: "Fashion",
      service: "Brand identity",
      work: "Brand identity for a fashion company.",
      direction: "A confident fashion identity that lets the collection lead, with an editorial feel suited to both digital and print presentation.",
      highlights: ["Fashion-led visual language", "Clear collection presentation", "Consistent brand touchpoints"],
      date: "April 2023"
    },
    "tasean-ecotravel": {
      category: "Client Work",
      title: "Tasean EcoTravel",
      intro: "A brand identity project for a travel company.",
      industry: "Travel",
      service: "Brand identity",
      work: "Brand identity for a travel company.",
      direction: "An inviting travel identity shaped around discovery, movement, and the promise of a well-planned journey.",
      highlights: ["Destination-inspired colour", "A sense of movement", "Clear, welcoming travel communication"],
      date: "September 2025"
    },
    "monarch-architecture": {
      category: "Client Work",
      title: "Monarch Architecture",
      intro: "A brand identity project for a build and design company.",
      industry: "Build and design",
      service: "Brand identity",
      work: "Brand identity for a build and design company.",
      direction: "A precise, architectural visual language that balances technical detail with a polished, client-ready presentation.",
      highlights: ["Plan-inspired linework", "Structured layouts", "A confident, considered palette"],
      date: "March 2025"
    },
    "ecs-financial-solutions": {
      category: "Client Work",
      title: "ECS Financial Solutions",
      intro: "A brand identity project for a financial solutions company.",
      industry: "Financial solutions",
      service: "Brand identity",
      work: "Brand identity for a financial solutions company.",
      direction: "A clear, assured identity that makes a complex financial offer feel approachable and professional.",
      highlights: ["Strong, legible typography", "A balanced corporate palette", "Clarity across key communications"],
      date: "January 2026"
    },
    "construction-networking-nairobi": {
      category: "Client Work",
      title: "Construction Networking Nairobi",
      intro: "A web development project for a construction event company.",
      industry: "Construction events",
      service: "Web development",
      work: "Web development for a construction event company.",
      direction: "An event-focused web experience that makes it easy to understand what is happening, who it is for, and how to take part.",
      highlights: ["At-a-glance event information", "Straightforward attendee pathways", "A professional industry presence"],
      date: "October 2025"
    },
    "eterna-lume-studio": {
      category: "Client Work",
      title: "Eterna Lume Studio",
      intro: "A web development project for an interior design studio.",
      industry: "Interior design",
      service: "Web development",
      work: "Web development for an interior design studio.",
      direction: "A portfolio-first website concept where generous imagery and calm typography give interior work room to speak.",
      highlights: ["Project-led browsing", "Quiet, spacious layouts", "Clear enquiry prompts"],
      date: "May 2025"
    },
    "roselle-interiors": {
      category: "Client Work",
      title: "Roselle Interiors",
      intro: "A web development project for an interior design company.",
      industry: "Interior design",
      service: "Web development",
      work: "Web development for an interior design company.",
      direction: "A polished digital showcase that pairs considered room imagery with simple navigation and a clear route to enquire.",
      highlights: ["Interior portfolio presentation", "Warm, restrained styling", "Accessible service information"],
      date: "February 2026"
    },
    "tenthgear-motorhub": {
      category: "Client Work",
      title: "TenthGear Motorhub",
      intro: "An e-commerce website project for a 4x4 automotive parts company.",
      industry: "4x4 automotive parts",
      service: "Web development · E-commerce",
      work: "E-commerce website development for a 4x4 automotive parts company.",
      direction: "A practical, product-led shopping experience that helps drivers browse parts and find the information they need before ordering.",
      highlights: ["Easy-to-scan product categories", "Useful part details", "A clear path from browse to enquiry or order"],
      date: "July 2023"
    },
    "kepsa": {
      category: "Client Work",
      title: "KEPSA",
      intro: "Event design consultation for an organisation in the private sector.",
      industry: "Private sector",
      service: "Event design consultation",
      work: "Event design consultation.",
      direction: "A cohesive event experience that helps important information feel clear before, during, and after the gathering.",
      highlights: ["Consistent event look and feel", "Clear attendee communications", "A professional setting for connection"],
      date: "November 2024"
    },
    "ism-africa": {
      category: "Client Work",
      title: "ISM Africa",
      intro: "A digital strategy project for a construction company.",
      industry: "Construction",
      service: "Digital strategy",
      work: "Digital strategy for a construction company.",
      direction: "A practical digital strategy that brings the company's expertise into focus and gives prospective clients a clear next step.",
      highlights: ["Service-led content priorities", "A credible digital presence", "Clear enquiry pathways"],
      date: "2024–2026"
    },
    "content-plan": {
      category: "Tips & Insights",
      title: "A simple content plan for a busy small business",
      date: "06 October 2026",
      intro: "Consistency does not require posting every day. Start with a clear weekly rhythm built around customer questions, helpful advice, proof of your work, and a direct invitation to take the next step.",
      challenge: "Many small teams spend time publishing without a clear audience, message, or measurement plan.",
      solution: "Pick one audience, choose three content themes, batch a month's worth of ideas, and decide in advance which action each post should encourage.",
      results: "A modest, useful plan helps you learn what resonates without turning social media into a full-time job."
    },
    "local-seo": {
      category: "Tips & Insights",
      title: "Local SEO essentials for Nairobi businesses",
      date: "21 September 2026",
      intro: "When customers search for a nearby service, accurate business information and useful location-specific pages can make it much easier for them to find and contact you.",
      challenge: "Out-of-date opening hours, inconsistent contact details, and generic website copy can undermine local visibility.",
      solution: "Keep your business profile complete, use consistent contact details, ask real customers for honest reviews, and publish useful service-area information.",
      results: "The result is a more trustworthy local presence that supports discovery across search, maps, and referrals."
    },
    "brand-consistency": {
      category: "Tips & Insights",
      title: "Why consistent branding builds customer confidence",
      date: "03 September 2026",
      intro: "Customers meet your brand in many places. A recognisable look and a steady voice help those separate interactions feel like one dependable business.",
      challenge: "When each channel uses different colours, logos, and messages, people have to work harder to understand who you are.",
      solution: "Set a small number of visual rules, define your tone of voice, and give your team practical templates they can use every day.",
      results: "Consistency makes marketing easier to produce and gives customers a clearer reason to remember you."
    },
    "agency-update": {
      category: "News",
      title: "Welyd Networks expands its creative services for local businesses",
      date: "12 October 2026",
      intro: "Welyd Networks is bringing brand design, website development, and campaign planning together in a more connected service for small and growing organizations.",
      challenge: "Businesses often coordinate several suppliers for a website, visual identity, and ongoing marketing.",
      solution: "Our integrated team coordinates the brand and digital experience from the first brief through launch and ongoing optimization.",
      results: "Clients get one clear point of contact and a joined-up plan designed around their goals."
    },
    "website-checklist": {
      category: "Tips & Insights",
      title: "Five checks before you launch your new website",
      date: "27 August 2026",
      intro: "A successful launch is more than a polished homepage. A short quality check can catch the details that shape trust and usability.",
      challenge: "Missing contact details, broken mobile layouts, and unclear calls to action can make a new site harder to use.",
      solution: "Review mobile layouts, test every form and link, add descriptive image text, check page titles, and make sure your contact information is current.",
      results: "A thoughtful pre-launch check makes it easier for real visitors to find what they need and take action."
    },
    "campaign-metrics": {
      category: "News",
      title: "The marketing metrics that matter beyond likes",
      date: "08 July 2026",
      intro: "Likes can be encouraging, but useful reporting connects activity to business outcomes. Start with a small set of measures tied to your campaign goal.",
      challenge: "A long dashboard of disconnected numbers can obscure whether marketing is creating awareness, qualified leads, or sales.",
      solution: "Track reach for awareness, qualified enquiries for lead generation, and conversion rate or cost per acquisition for sales campaigns.",
      results: "Clear measures help teams make better decisions and explain the value of the next marketing investment."
    }
  };

  const filterButtons = document.querySelectorAll(".filter-btn");
  const articleCards = document.querySelectorAll(".article-card");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      articleCards.forEach((card) => {
        card.hidden = filter !== "all" && card.dataset.category !== filter;
      });
    });
  });

  const modal = document.querySelector(".modal");
  const modalContent = modal?.querySelector(".modal-content");
  let modalOpener = null;
  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    modalOpener?.focus();
  };
  document.querySelectorAll("[data-article]").forEach((button) => {
    button.addEventListener("click", () => {
      const article = articles[button.dataset.article];
      if (!article || !modal || !modalContent) return;
      modalOpener = button;
      const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      })[character]);
      const caseHtml = article.category === "Client Work"
        ? (() => {
          const image = button.closest(".article-card")?.querySelector(".client-project-image img");
          const caption = image?.closest("figure")?.querySelector("figcaption")?.textContent.trim();
          const visualHtml = image
            ? `<figure class="project-story-visual"><img src="${escapeHtml(image.getAttribute("src"))}" alt="${escapeHtml(image.getAttribute("alt"))}" loading="lazy" decoding="async"><figcaption>${escapeHtml(caption || article.title)}</figcaption></figure>`
            : "";
          const highlights = article.highlights.map((highlight) => `<li>${escapeHtml(highlight)}</li>`).join("");
          return `${visualHtml}<div class="project-case"><div class="case-details"><p><strong>Industry:</strong> ${escapeHtml(article.industry)}</p><p><strong>Service:</strong> ${escapeHtml(article.service)}</p><p><strong>Work:</strong> ${escapeHtml(article.work)}</p></div><section class="project-direction" aria-labelledby="project-direction-title"><p class="eyebrow">Creative direction</p><h3 id="project-direction-title">A concept shaped around the brief</h3><p>${escapeHtml(article.direction)}</p><ul class="project-highlight-list">${highlights}</ul></section><p class="project-visual-note">Project visuals are supplied artwork or representative imagery. Creative direction describes the brief, not unshared performance results.</p></div>`;
        })()
        : `<div class="case-details"><p><strong>Key takeaway:</strong> ${article.results}</p><p>${article.solution}</p></div>`;
      const articleDate = article.date
        ? `<p class="article-meta">${article.category === "Client Work" ? `Project period: ${article.date}` : article.date}</p>`
        : "";
      modalContent.innerHTML = article.category === "Client Work"
        ? `<span class="category-tag">${escapeHtml(article.category)}</span>${articleDate}<h2 id="modal-title">${escapeHtml(article.title)}</h2><p>${escapeHtml(article.intro)}</p>${caseHtml}`
        : `<span class="category-tag">${article.category}</span>${articleDate}<h2 id="modal-title">${article.title}</h2><p>${article.intro}</p>${caseHtml}`;
      modal.querySelector(".modal-dialog").scrollTop = 0;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      modal.querySelector(".modal-close").focus();
    });
  });
  modal?.querySelector(".modal-close")?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (!modal?.classList.contains("is-open")) return;
    if (event.key === "Escape") {
      closeModal();
      return;
    }
    if (event.key === "Tab") {
      const focusable = [...modal.querySelectorAll("button, a[href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
        .filter((element) => !element.disabled && element.getClientRects().length);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  const newsletter = document.querySelector(".newsletter-form");
  newsletter?.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = newsletter.querySelector('input[type="email"]');
    const status = newsletter.parentElement.querySelector(".form-note");
    if (!email.checkValidity()) {
      email.reportValidity();
      return;
    }
    status.textContent = "Your email is valid, but subscriptions are not being saved yet. Connect a mailing-list provider to activate sign-ups.";
    status.setAttribute("role", "status");
    newsletter.reset();
  });

  const inquiryForm = document.querySelector("#inquiry-form");
  if (inquiryForm) {
    const requestedService = new URLSearchParams(window.location.search).get("service");
    if (requestedService) {
      const requestedServiceKey = requestedService.toLowerCase();
      const isBrandingAndDesign = requestedServiceKey.includes("branding") && requestedServiceKey.includes("graphic design");
      inquiryForm.querySelectorAll('input[name="services"]').forEach((checkbox) => {
        const serviceKey = checkbox.value.toLowerCase();
        if (serviceKey.includes(requestedServiceKey) || (isBrandingAndDesign && ["branding", "graphic design"].includes(serviceKey))) checkbox.checked = true;
      });
    }
  }
  const customMerchForm = document.querySelector("#custom-merch-request");
  if (customMerchForm) {
    const productOptions = [...customMerchForm.querySelectorAll('input[name="products"]')];
    const brandingOptions = [...customMerchForm.querySelectorAll('input[name="branding"]')];
    const status = customMerchForm.querySelector("#custom-request-status");
    const result = customMerchForm.querySelector("#custom-request-result");
    const emailLink = customMerchForm.querySelector("[data-request-email-link]");

    const syncProductQuantities = () => {
      productOptions.forEach((option) => {
        const quantity = [...customMerchForm.querySelectorAll('input[type="number"]')]
          .find((field) => field.name === `quantity-${option.value}`);
        quantity.disabled = !option.checked;
        quantity.required = option.checked;
      });
      productOptions[0].setCustomValidity(productOptions.some((option) => option.checked) ? "" : "Choose at least one product type.");
    };
    const syncBrandingOptions = () => {
      brandingOptions[0].setCustomValidity(brandingOptions.some((option) => option.checked) ? "" : "Choose a branding option, or select the recommendation option.");
    };

    productOptions.forEach((option) => option.addEventListener("change", syncProductQuantities));
    brandingOptions.forEach((option) => option.addEventListener("change", syncBrandingOptions));
    syncProductQuantities();
    syncBrandingOptions();

    customMerchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      syncProductQuantities();
      syncBrandingOptions();
      if (!customMerchForm.reportValidity()) return;

      const data = new FormData(customMerchForm);
      const products = productOptions
        .filter((option) => option.checked)
        .map((option) => `${option.value}: ${data.get(`quantity-${option.value}`)}`);
      const lines = [
        `Name: ${data.get("name")}`,
        `Business or organization: ${data.get("company")}`,
        `Email: ${data.get("email")}`,
        `Phone or WhatsApp: ${data.get("phone") || "Not provided"}`,
        `Purpose: ${data.get("purpose")}`,
        `Products and quantities: ${products.join("; ")}`,
        `Branding: ${data.getAll("branding").join(", ")}`,
        `Preferred colours: ${data.get("colours") || "Not specified"}`,
        `Clothing sizes: ${data.get("sizes") || "Not specified"}`,
        `Needed by: ${data.get("needed_by") || "Not specified"}`,
        `Approximate budget: ${data.get("budget") || "Not specified"}`,
        `Logo or brand guidelines: ${data.get("brand_link") || "Not provided"}`,
        `Additional details: ${data.get("notes") || "None"}`
      ];
      const subject = `Custom merchandise request - ${data.get("company")}`;
      emailLink.href = `mailto:hello@welydnetworks.co.ke?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
      result.hidden = false;
      status.className = "form-status info";
      status.textContent = "Your details are ready. Review them in your email app and send the message to submit your request.";
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
      emailLink.focus({ preventScroll: true });
    });
  }
  inquiryForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = inquiryForm.querySelector(".form-status");
    const submitButton = inquiryForm.querySelector('button[type="submit"]');
    const errors = [];
    inquiryForm.querySelectorAll("[data-error-for]").forEach((node) => { node.textContent = ""; });
    inquiryForm.querySelectorAll("[aria-invalid='true']").forEach((node) => node.removeAttribute("aria-invalid"));

    inquiryForm.querySelectorAll("[required]").forEach((field) => {
      if (field.type === "checkbox") return;
      if (!field.value.trim() || !field.checkValidity()) {
        field.setAttribute("aria-invalid", "true");
        const error = inquiryForm.querySelector(`[data-error-for="${field.name}"]`);
        if (error) {
          error.textContent = field.validity.typeMismatch
            ? "Enter a valid email address."
            : field.validity.tooShort
              ? `Please enter at least ${field.minLength} characters.`
              : "This field is required.";
        }
        errors.push(field.labels?.[0]?.textContent || field.name);
      }
    });
    const selectedServices = inquiryForm.querySelectorAll('input[name="services"]:checked');
    if (!selectedServices.length) {
      const serviceError = inquiryForm.querySelector('[data-error-for="services"]');
      if (serviceError) serviceError.textContent = "Choose at least one service so we can direct your enquiry.";
      errors.push("service");
    }
    const consent = inquiryForm.querySelector('input[name="consent"]');
    if (!consent.checked) {
      const consentError = inquiryForm.querySelector('[data-error-for="consent"]');
      if (consentError) consentError.textContent = "Please confirm before submitting.";
      errors.push("consent");
    }
    if (errors.length) {
      status.className = "form-status error";
      status.textContent = "Please review the highlighted fields and try again.";
      inquiryForm.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    if (inquiryForm.querySelector('[name="website"]').value) {
      status.className = "form-status error";
      status.textContent = "We couldn't verify this submission. Please try again or email us directly.";
      return;
    }
    if (FORM_ENDPOINT.includes("REPLACE_WITH_YOUR_FORM_ID")) {
      status.className = "form-status info";
      status.textContent = "Your details are valid, but this form is not connected yet. Add your Formspree endpoint in js/main.js before accepting live enquiries.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending your enquiry…";
    status.className = "form-status";
    status.textContent = "";
    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: new FormData(inquiryForm),
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error(`The form provider returned ${response.status}.`);
      status.className = "form-status success";
      status.textContent = "Thank you for reaching out. Your enquiry is on its way, and we’ll be in touch within one business day.";
      inquiryForm.reset();
    } catch (error) {
      status.className = "form-status error";
      status.textContent = `We couldn't send your enquiry. ${error.message} Please try again or email us directly.`;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send my inquiry";
    }
  });
});
