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

document.addEventListener("DOMContentLoaded", () => {
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
      if (event.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) closeMenu();
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
        && window.matchMedia("(hover: hover) and (min-width: 981px)").matches;
      const willOpen = isHoverPointer || toggle.getAttribute("aria-expanded") !== "true";
      if (willOpen) openDropdown();
      else closeDropdown();
    });
    dropdown.addEventListener("mouseenter", () => {
      if (window.matchMedia("(hover: hover) and (min-width: 981px)").matches) openDropdown();
    });
    dropdown.addEventListener("mouseleave", () => {
      if (window.matchMedia("(hover: hover) and (min-width: 981px)").matches) closeDropdown();
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
    "retail-launch": {
      category: "Case Study",
      title: "A neighborhood retailer finds its next 1,000 customers online",
      date: "18 September 2026",
      intro: "A Nairobi home and lifestyle retailer had a loyal walk-in audience but little visibility beyond its neighborhood. The team wanted a practical digital foundation that could turn local discovery into store visits and enquiries.",
      challenge: "An inconsistent social presence, no reliable measurement, and a product catalogue that was difficult to browse on mobile.",
      solution: "We refreshed the visual system, planned a six-week content calendar, improved local search listings, and ran tightly targeted Meta campaigns with clear enquiry tracking.",
      results: "Over the first campaign period, qualified enquiries rose 64%, profile visits doubled, and the brand built a repeatable weekly content routine."
    },
    "school-identity": {
      category: "Case Study",
      title: "Giving a growing school a brand families can recognize",
      date: "02 August 2026",
      intro: "A fast-growing learning centre needed a clear and welcoming identity to communicate its approach to parents across print, web, and social channels.",
      challenge: "The school used several versions of its logo and had no shared guidelines for parent communications or admissions campaigns.",
      solution: "We created a flexible identity toolkit, designed an admissions campaign, and delivered reusable templates for staff and social media.",
      results: "The new admissions materials generated 38% more campaign enquiries than the school's previous intake campaign."
    },
    "ngo-impact": {
      category: "Case Study",
      title: "Making an NGO's impact easier to understand and support",
      date: "14 June 2026",
      intro: "A community organization had powerful programme results but needed a concise digital story that partners and supporters could understand quickly.",
      challenge: "Important programme information was scattered across long documents, making it hard for new partners to see the outcomes.",
      solution: "We structured the impact narrative, designed a mobile-first campaign page, and created a consistent set of social and presentation graphics.",
      results: "The campaign page recorded 2.3× more partner enquiries than the previous information page during its first eight weeks."
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
      const caseHtml = article.category === "Case Study"
        ? `<div class="case-details"><p><strong>Client:</strong> ${button.dataset.client || "A Welyd Networks client"}</p><p><strong>Challenge:</strong> ${article.challenge}</p><p><strong>Solution:</strong> ${article.solution}</p><p><strong>Results:</strong> ${article.results}</p></div>`
        : `<div class="case-details"><p><strong>Key takeaway:</strong> ${article.results}</p><p>${article.solution}</p></div>`;
      modalContent.innerHTML = `<span class="category-tag">${article.category}</span><p class="article-meta">${article.date}</p><h2 id="modal-title">${article.title}</h2><p>${article.intro}</p>${caseHtml}`;
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
