document.addEventListener("DOMContentLoaded", function () {
  initMobileMenu();
  initScrollToTop();
  initCountdown();
  initFAQAccordion();
  initScheduleTabs();
  initForms();
  initSmoothScroll();
  initTimelineAnimation();
  initScrollAnimations();
});

// Mobile Menu Functionality
function initMobileMenu() {
  const header = document.querySelector(".header");
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mainNav = document.querySelector(".main-nav");
  const navLinks = document.querySelectorAll(".main-nav a");
  const logo = document.querySelector(".logo");

  mobileMenuBtn.addEventListener("click", function () {
    this.classList.toggle("active");
    mainNav.classList.toggle("active");
  
    if (mainNav.classList.contains("active")) {
      document.body.style.overflow = "hidden";
      mainNav.style.display = "flex"; // Change to flex instead of block
    } else {
      document.body.style.overflow = "";
      // Use setTimeout to delay hiding the menu until after the animation
      setTimeout(() => {
        if (!mainNav.classList.contains("active")) {
          mainNav.style.display = "none";
        }
      }, 400); // Match this to your transition time
    }
  });
  
  document.addEventListener("click", function (e) {
    if (
      mainNav.classList.contains("active") &&
      !mainNav.contains(e.target) &&
      !mobileMenuBtn.contains(e.target)
    ) {
      mainNav.classList.remove("active");
      mobileMenuBtn.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  let lastScrollTop = 0;
  const scrollThreshold = 50;

  function handleScroll() {
    const currentScrollTop = 
      window.scrollY || document.documentElement.scrollTop;
  
    if (currentScrollTop > scrollThreshold) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
    updateActiveMenu();
  
    lastScrollTop = currentScrollTop;
  }

  let scrollTimeout;
  window.addEventListener("scroll", function () {
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(function () {
        handleScroll();
        scrollTimeout = null;
      }, 10);
    }
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      if (this.getAttribute("href").startsWith("#")) {
        e.preventDefault();

        const targetId = this.getAttribute("href");
        const targetSection = document.querySelector(targetId);

        if (targetSection) {
          mainNav.classList.remove("active");
          mobileMenuBtn.classList.remove("active");
          document.body.style.overflow = "";

          const headerHeight = header.offsetHeight;
          const targetPosition =
            targetSection.getBoundingClientRect().top +
            window.scrollY -
            headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          });

          history.pushState(null, null, targetId);

          navLinks.forEach((navLink) => navLink.classList.remove("active"));
          this.classList.add("active");
        }
      }
    });
  });

  function updateActiveMenu() {
    const sections = document.querySelectorAll("section[id]");
    const scrollPosition = window.scrollY || document.documentElement.scrollTop;

    if (sections.length > 0) {
      let currentSection = "";
      const headerHeight = header.offsetHeight;

      sections.forEach((section) => {
        const sectionTop = section.offsetTop - headerHeight - 100;
        const sectionHeight = section.offsetHeight;

        if (
          scrollPosition >= sectionTop &&
          scrollPosition < sectionTop + sectionHeight
        ) {
          currentSection = "#" + section.getAttribute("id");
        }
      });
      navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === currentSection) {
          link.classList.add("active");
        }
      });
    }
  }

  logo.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  updateActiveMenu();

  const preloadLink = document.createElement("div");
  preloadLink.style.position = "absolute";
  preloadLink.style.opacity = "0";
  preloadLink.style.pointerEvents = "none";
  preloadLink.innerHTML = '<a class="main-nav a:hover"></a>';
  document.body.appendChild(preloadLink);
  setTimeout(() => {
    document.body.removeChild(preloadLink);
  }, 100);
}

// Scroll to Top Button
function initScrollToTop() {
  const scrollToTopBtn = document.getElementById("scrollToTop");

  if (!scrollToTopBtn) return;

  scrollToTopBtn.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  window.addEventListener(
    "scroll",
    debounce(() => {
      if (window.scrollY > 300) {
        scrollToTopBtn.style.opacity = "1";
        scrollToTopBtn.style.visibility = "visible";
      } else {
        scrollToTopBtn.style.opacity = "0";
        setTimeout(() => {
          if (window.scrollY <= 300) {
            scrollToTopBtn.style.visibility = "hidden";
          }
        }, 300);
      }
    }, 100)
  );
}

// Countdown Timer
function initCountdown() {
  const eventDate = new Date("April 11, 2025 09:00:00").getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const timeLeft = eventDate - now;

    if (timeLeft <= 0) {
      document.getElementById("days").textContent = "0";
      document.getElementById("hours").textContent = "0";
      document.getElementById("minutes").textContent = "0";
      document.getElementById("seconds").textContent = "0";
      return;
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    document.getElementById("days").textContent = days;
    document.getElementById("hours").textContent = hours;
    document.getElementById("minutes").textContent = minutes;
    document.getElementById("seconds").textContent = seconds;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// FAQ Accordion
function initFAQAccordion() {
  const faqItems = document.querySelectorAll(".faq-question");

  faqItems.forEach((item) => {
    item.addEventListener("click", function () {
      const parent = this.parentElement;
      parent.classList.toggle("active");

      // Close other FAQs
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.parentElement.classList.remove("active");
        }
      });
    });
  });
}

// Schedule Tabs
function initScheduleTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const tabId = btn.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
    });
  });
}

// Form Handling
function initForms() {
  const registerForm = document.querySelector(".register-form");
  const contactForm = document.querySelector(".contact-form");

  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault();
      showFeedback(
        "Thank you for registering! We will contact you soon.",
        true
      );
      this.reset();
    });
  }

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      showFeedback(
        "Thank you for your message! We will get back to you shortly.",
        true
      );
      this.reset();
    });
  }
}

// Smooth Scroll for Anchor Links
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");

      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const headerHeight = document.querySelector(".header").offsetHeight;
        const targetPosition = targetElement.offsetTop - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    });
  });
}

function initTimelineAnimation() {
  const timeline = document.querySelector(".timeline");
  const timelineItems = document.querySelectorAll(".timeline-item");
  const timelineLine = timeline.querySelector("::before");
  let activeIndex = -1;

  //array to track animation states
  const animations = Array(timelineItems.length).fill(false);

  // Function to handle timeline progress and item visibility
  function handleTimelineProgress() {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    const timelineTop = timeline.getBoundingClientRect().top + scrollTop;
    const timelineHeight = timeline.offsetHeight;
    const timelineBottom = timelineTop + timelineHeight;

    if (timelineTop < scrollTop + windowHeight && timelineBottom > scrollTop) {
      const visibleStart = Math.max(timelineTop, scrollTop);
      const visibleEnd = Math.min(timelineBottom, scrollTop + windowHeight);
      const visibleHeight = visibleEnd - visibleStart;
      const percentVisible = Math.min(
        (visibleHeight / timelineHeight) * 1.3,
        1
      );

      // Animate the timeline line height
      timeline.style.setProperty("--line-height", `${percentVisible * 100}%`);
      document.documentElement.style.setProperty(
        "--timeline-progress",
        percentVisible
      );
    }

    timelineItems.forEach((item, index) => {
      const rect = item.getBoundingClientRect();

      if (rect.top < windowHeight * 0.8 && rect.bottom > 0) {
        if (!animations[index]) {
          item.classList.add("visible");
          animations[index] = true;
        }

        const centerPosition = rect.top + rect.height / 2;
        const distanceFromCenter = Math.abs(centerPosition - windowHeight / 2);
        const maxDistance = windowHeight / 2;
        const centeredness = 1 - distanceFromCenter / maxDistance;

        if (centeredness > 0.7) {
          if (activeIndex !== index) {
            if (activeIndex >= 0) {
              timelineItems[activeIndex].classList.remove("active");
            }

            item.classList.add("active");
            activeIndex = index;

            const progress = (index + 1) / timelineItems.length;
            document.documentElement.style.setProperty(
              "--item-progress",
              progress
            );
          }
        }
      } else if (rect.top > windowHeight && animations[index]) {
        //reset if scrolling back up
        item.classList.remove("visible");
        animations[index] = false;
      }
    });
  }

  // Add style rule for timeline line
  document.documentElement.style.setProperty(
    "--timeline-items",
    timelineItems.length
  );

  // Create animated path for timeline connector
  const timelineSVG = document.createElement("svg");
  timelineSVG.classList.add("timeline-connector");
  timelineSVG.setAttribute("width", "100%");
  timelineSVG.setAttribute("height", "100%");
  timelineSVG.innerHTML = `
    <path class="timeline-path" d="M0,0 L0,100%" stroke="url(#gradient)" stroke-width="4" fill="none" stroke-dasharray="1000" stroke-dashoffset="1000" />
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="var(--gold)" />
        <stop offset="100%" stop-color="var(--primary)" />
      </linearGradient>
    </defs>
  `;
  timeline.prepend(timelineSVG);

  // Add scroll event listener
  window.addEventListener("scroll", function () {
    window.requestAnimationFrame(handleTimelineProgress);
  });

  handleTimelineProgress();

  //  Add mouse/touch interaction
  timeline.addEventListener("mousemove", function (e) {
    const timelineRect = timeline.getBoundingClientRect();
    const mouseY = e.clientY - timelineRect.top;
    const percentY = mouseY / timelineRect.height;

    const itemIndex = Math.floor(percentY * timelineItems.length);
    if (itemIndex >= 0 && itemIndex < timelineItems.length) {
      timelineItems.forEach((item, idx) => {
        if (idx === itemIndex) {
          item.classList.add("hover");
        } else {
          item.classList.remove("hover");
        }
      });
    }
  });

  // Add scroll-into-view functionality
  timelineItems.forEach((item, index) => {
    item.addEventListener("click", function () {
      item.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  });

  // Add an intersection observer for timeline section
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          timeline.classList.add("in-view");

          const headerText = document.querySelector(".schedule .section-title");
          if (headerText) {
            headerText.classList.add("animate");

            const text = headerText.textContent;
            headerText.innerHTML = "";
            for (let i = 0; i < text.length; i++) {
              const span = document.createElement("span");
              span.textContent = text[i];
              span.style.animationDelay = `${0.1 + i * 0.05}s`;
              headerText.appendChild(span);
            }
          }
        } else {
          timeline.classList.remove("in-view");
        }
      });
    },
    {
      threshold: 0.2,
    }
  );

  observer.observe(timeline);
}

// Scroll Animations
function initScrollAnimations() {
  const elements = document.querySelectorAll(
    ".event-card, .prize-card, .timeline-item, .speaker-card"
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate");
        }
      });
    },
    { threshold: 0.2 }
  );

  elements.forEach((element) => observer.observe(element));
}

// Utility Functions
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function showFeedback(message, isSuccess) {
  const feedback = document.createElement("div");
  feedback.className = `feedback-message ${isSuccess ? "success" : "error"}`;
  feedback.textContent = message;
  document.body.appendChild(feedback);

  setTimeout(() => {
    feedback.remove();
  }, 3000);
}
