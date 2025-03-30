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
  initEventPopups();
});

// Mobile Menu Functionality
function initMobileMenu() {
  const header = document.querySelector(".header");
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const mainNav = document.querySelector(".main-nav");
  const navLinks = document.querySelectorAll(".main-nav a");
  const logo = document.querySelector(".logo");

  // Mobile menu toggle
  mobileMenuBtn.addEventListener("click", function() {
    this.classList.toggle("active");
    mainNav.classList.toggle("active");
    
    if (mainNav.classList.contains("active")) {
      document.body.style.overflow = "hidden"; 
      mainNav.style.display = "flex"; // Show menu
    } else {
      document.body.style.overflow = ""; 
      
      setTimeout(() => {
        if (!mainNav.classList.contains("active")) {
          mainNav.style.display = "none";
        }
      }, 400); 
    }
  });

  // Close menu when clicking outside
  document.addEventListener("click", function(e) {
    if (
      mainNav.classList.contains("active") &&
      !mainNav.contains(e.target) &&
      !mobileMenuBtn.contains(e.target)
    ) {
      mainNav.classList.remove("active");
      mobileMenuBtn.classList.remove("active");
      document.body.style.overflow = "";
      
      // Wait for transition to finish before hiding
      setTimeout(() => {
        if (!mainNav.classList.contains("active")) {
          mainNav.style.display = "none";
        }
      }, 400);
    }
  });
  // Scroll handling
  let lastScrollTop = 0;
  const scrollThreshold = 50;

  function handleScroll() {
    const currentScrollTop = window.scrollY || document.documentElement.scrollTop;

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
  const eventDate = new Date("April 16, 2025 09:00:00").getTime();

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

document.addEventListener("DOMContentLoaded", function () {
  // Fix for viewport width issues
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    const newMeta = document.createElement("meta");
    newMeta.name = "viewport";
    newMeta.content =
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
    document.head.appendChild(newMeta);
  } else {
    meta.content =
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
  }

  // Apply fix to main container/sections
  const allSections = document.querySelectorAll(
    "section, .container, .hero, .hero-content, #hero-heading"
  );
  allSections.forEach((section) => {
    section.style.width = "100%";
    section.style.maxWidth = "100%";
    section.style.boxSizing = "border-box";
  });
});

//Function to popup for events description
function initEventPopups() {
  const eventCards = document.querySelectorAll(".event-card");
  const eventPopup = document.getElementById("eventPopup");
  const closePopup = document.querySelector(".close-popup");

  // Event data
  const eventsData = {
    "HackSutra": {
      image: "./Images/Quiz.jpg",
      date: "April 16, 2025",
      duration: "1.5 hours (11:00AM - 12:30PM)",
      team: "2 members",
      registrationValue: "coding",
      description:
        "Just as ancient sages crafted powerful sutras to solve cosmic challenges, modern coders weave digital spells through algorithms and logic. In HackSutra, you will channel the wisdom of Vishwakarma, the divine architect, to build and repair digital creations.",
      rules: [
        "Coding and Debugging competition",
        "2 rounds: Knowledge & Restoration, Creation",
        "Summon your coding powers on the HackerRank battlefield",
        "Registration fee: ₹250"
      ],
      contact: ["Naveena N A: 9110677146", "Mukund Kumar G: 6362070659"]
    },
    "KuruKshetra 1 (BGMI)": {
      image: "./Images/BGMI.jpg",
      date: "April 16, 2025",
      duration: "2 hours (11:00AM - 1:00PM)",
      team: "4 members",
      registrationValue: "bgmi",
      description:
        "Like the epic 18-day war between the Pandavas and Kauravas on the hallowed grounds of Kurukshetra, teams will engage in digital warfare that tests strategy, teamwork, and combat prowess.",
      rules: [
        "Each army must consist of exactly 4 warriors",
        "Warriors must bring their own divine instruments and celestial connections",
        "All warriors must prepare their battlegrounds in advance",
        "The use of forbidden arts will result in banishment from the tournament",
        "Warriors should come equipped with all necessary battle gear",
        "Registration fee: ₹400"
      ],
      contact: ["Harsha L: 9606245398", "Gagan A M: 8431642756", "Kiran R: 9880967408"]
    },
    "Sanjeevini Quest (Treasure Hunt)": {
      image: "./Images/TreasureHunt.jpg",
      date: "April 17, 2025",
      duration: "2.5 hours (2:00PM - 4:30PM)",
      team: "2-4 members",
      registrationValue: "treasurehunt",
      description:
        "Following in the footsteps of Lord Hanuman's legendary journey to find the Sanjeevani herb to save Lakshmana, teams must embark on an epic treasure hunt requiring wit, courage, and teamwork to overcome obstacles and find the sacred prize.",
      rules: [
        "Seekers must follow the divine path in sequence without skipping trials",
        "The sacred clues must not be damaged or altered",
        "Using forbidden methods will result in divine banishment",
        "Time limits bind all seekers to the mortal realm",
        "The first team to retrieve the Sanjeevani shall be crowned victorious",
        "In case of a tie, the speed of previous trials shall determine the victor",
        "Registration fee: ₹400"
      ],
      contact: ["Mukund Kumar G: 6362070659"]
    },
    "RajaSuya Yaga (IPL Auction)": {
      image: "./Images/IPLAuction.jpg",
      date: "April 16, 2025",
      duration: "4.5 hours (12:00PM - 4:30PM)",
      team: "4 members",
      registrationValue: "iplauction",
      description:
        "Just as Emperor Yudhishthira performed the RajaSuya sacrifice to establish supremacy, modern strategists must complete this ritual of team selection and resource management to build a cricket empire worthy of the gods.",
      rules: [
        "2 sacred rituals: The Test of Cricketing Wisdom and The Grand Auction",
        "Some questions on the ancient lore of IPL, legendary players, and sacred auction rules",
        "Only the knowledgeable shall proceed to the main ceremony",
        "Each kingdom begins with 100 Crore golden coins from the royal treasury",
        "Players shall be offered to the kingdoms in divine order: Celestial Stars, Mighty Strikers, Mystical Bowlers, Divine All-Rounders, Keeper of Wickets, and Rising Talents",
        "Kingdoms must assemble their forces with wisdom and foresight",
        "Registration fee: ₹400"
      ],
      contact: ["Naveena N A: 9110677146", "Kiran R: 9880967408"]
    },
    "Yaksha Prashna (IT Quiz)": {
      image: "./Images/ITQuiz.jpg",
      date: "April 17, 2025",
      duration: "2 hours (10:00AM - 12:00 Noon)",
      team: "2 members",
      registrationValue: "itquiz",
      description:
        "Just as the Yaksha tested Yudhishthira with profound questions before granting access to the sacred lake, participants must prove their technical knowledge through increasingly challenging riddles of IT wisdom.",
      rules: [
        "3 levels: The Rain of Questions, The Circle of Knowledge, The Lightning Round",
        "A shower of multiple-choice questions on the mystical Kahoot platform",
        "Swift and accurate answers shall be rewarded with divine favor",
        "Each council takes turns answering the Yaksha's questions",
        "Unanswered questions pass like the wind to the next council",
        "Councils must race to answer the Yaksha's most challenging riddles",
        "The first to signal shall attempt an answer with no second chances",
        "Registration fee: ₹250"
      ],
      contact: ["Naveena N A: 9110677146", "Mukund Kumar G: 6362070659"]
    },
    "KuruKshetra 2 (Free Fire)": {
      image: "./Images/FreeFire.jpg",
      date: "April 17, 2025",
      duration: "3 hours (10:00AM - 1:00PM)",
      team: "4 members",
      registrationValue: "freefire",
      description:
        "Inspired by Agni Pariksha, the trial by fire, warriors must prove their mettle in the Free Fire arena where only the most skilled and strategic teams will emerge victorious from the flames of battle.",
      rules: [
        "Each army must consist of exactly 4 warriors",
        "Warriors must bring their own divine instruments and celestial connections",
        "All warriors must prepare their battlegrounds in advance",
        "The use of forbidden arts will result in banishment from the tournament",
        "Warriors should come equipped with all necessary battle gear",
        "Registration fee: ₹300"
      ],
      contact: ["Varun L J: 8217679129", "Gagan A M: 8431642756", "Kiran R: 9880967408"]
    },
    "Chakravyuha (Escape Room)": {
      image: "./Images/EscapeRoom.jpg",
      date: "April 16, 2025",
      duration: "2 hours (11:00AM - 1:00PM)",
      team: "2 members",
      registrationValue: "escaperoom",
      description:
        "Like Abhimanyu navigating the complex Chakravyuha formation in the Mahabharata, teams must solve intricate puzzles and break through layers of challenges to escape from this modern labyrinth of logical barriers.",
      rules: [
        "Teams consist of exactly 2 brave souls",
        "The Maze Master may offer guidance, but at the cost of precious time",
        "The depths of each challenge shall be revealed only at the moment of truth",
        "Only the most skilled navigators shall advance to the inner sanctum",
        "Time is both ally and enemy in this divine challenge",
        "Registration fee: ₹200"
      ],
      contact: ["Varsha: 7892293986", "Harshitha G: 6363196128"]
    },
    "DevaJanma (Start Up)": {
      image: "./Images/StartUp.jpg",
      date: "April 17, 2025",
      duration: "1.5 hours (11:30AM - 1:00PM)",
      team: "2 members",
      registrationValue: "startup",
      description:
        "Just as the cosmos was born from creative thought, new ventures arise from innovative minds. Like deities creating new worlds, entrepreneurs must breathe life into ideas that can transform reality.",
      rules: [
        "All ventures must harness the divine powers of technology (AI, IoT, Cybersecurity, Web3)",
        "Ideas must be original, like unique constellations in the night sky",
        "Presentations must adhere to the sacred format and time constraints",
        "The judgment of the divine council is final and absolute",
        "Using another's ideas as your own will invoke the curse of disqualification",
        "Registration fee: ₹200"
      ],
      contact: ["Naveena N A: 9110677146", "Mukund Kumar G: 6362070659", "Harsha L: 9606245398"]
    }
  };

  // Add view more button to each event card
  eventCards.forEach((card) => {
    const viewMoreBtn = document.createElement("a");
    viewMoreBtn.className = "event-link view-more";
    viewMoreBtn.textContent = "View Details";
    viewMoreBtn.href = "#";

    const eventContent = card.querySelector(".event-content");
    eventContent.appendChild(viewMoreBtn);

    viewMoreBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const eventTitle = card.querySelector(".event-title").textContent;
      showEventPopup(eventTitle);
    });
  });

  // Show popup with event details
  function showEventPopup(eventTitle) {
    const mainTitle = eventTitle.split('(')[0].trim();
    let eventData = eventsData[eventTitle];
    
    if (!eventData) {
      const possibleKey = Object.keys(eventsData).find(key => 
        key.startsWith(mainTitle) || eventTitle.startsWith(key)
      );
      eventData = possibleKey ? eventsData[possibleKey] : null;
    }
    
    if (!eventData) {
      console.error(`No data found for event: ${eventTitle}`);
      return;
    }
  
    // Set basic event information
    document.getElementById("popupEventTitle").textContent = eventTitle;
    document.getElementById(
      "popupEventImage"
    ).style.backgroundImage = `url(${eventData.image})`;
    document.getElementById("popupEventDate").textContent = eventData.date;
    document.getElementById("popupEventDuration").textContent = eventData.duration;
    document.getElementById("popupEventTeam").textContent = eventData.team;
    document.getElementById("popupEventDescription").textContent = eventData.description;
  
    // Set rules
    const rulesList = document.getElementById("popupEventRules");
    rulesList.innerHTML = "<h3>Rules & Guidelines</h3><ul></ul>";
    
    eventData.rules.forEach((rule) => {
      const li = document.createElement("li");
      li.textContent = rule;
      rulesList.querySelector("ul").appendChild(li);
    });
  
    // Add contact information section
    if (eventData.contact && eventData.contact.length > 0) {
      const contactSection = document.createElement("div");
      contactSection.className = "event-contact-info";
      contactSection.innerHTML = "<h3>Contact Coordinators</h3><ul></ul>";
      
      eventData.contact.forEach((contact) => {
        const li = document.createElement("li");
        li.textContent = contact;
        contactSection.querySelector("ul").appendChild(li);
      });
      
      // Append contact section after rules or replace existing one
      const existingContactSection = document.querySelector(".event-contact-info");
      if (existingContactSection) {
        existingContactSection.replaceWith(contactSection);
      } else {
        rulesList.after(contactSection);
      }
    }
  
    // Extract registration fee from rules and display it prominently
    const feeRule = eventData.rules.find(rule => rule.includes("₹"));
    if (feeRule) {
      const feeAmount = feeRule.match(/₹(\d+)/)[1];
      const feeDisplay = document.getElementById("popupEventFee") || document.createElement("div");
      feeDisplay.id = "popupEventFee";
      feeDisplay.className = "event-fee";
      feeDisplay.innerHTML = `<strong>Registration Fee:</strong> ₹${feeAmount}`;
      
      // Insert fee display after the team size information
      const teamInfo = document.getElementById("popupEventTeam");
      if (teamInfo.nextElementSibling) {
        teamInfo.parentNode.insertBefore(feeDisplay, teamInfo.nextElementSibling);
      } else {
        teamInfo.parentNode.appendChild(feeDisplay);
      }
    }
    
    // Set up the registration button
    const registerBtn = document.querySelector(".event-popup-cta .btn");
    registerBtn.setAttribute("data-event", eventData.registrationValue);
    registerBtn.textContent = "Reserve Your Slot";
    registerBtn.classList.add("register-from-popup");
  
    // Display the popup
    const eventPopup = document.getElementById("eventPopup");
    eventPopup.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  // Scroll to registration and select event
  function scrollToRegistration(eventValue) {
    eventPopup.classList.remove("active");
    document.body.style.overflow = "";

    const registerSection = document.getElementById("reserve-interest");
    if (registerSection) {
      const headerHeight = document.querySelector(".header").offsetHeight;
      const targetPosition = registerSection.offsetTop - headerHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });

      setTimeout(() => {
        const interestSelect = document.getElementById("reserve-interest");
        if (interestSelect) {
          interestSelect.value = eventValue;
          const event = new Event("change");
          interestSelect.dispatchEvent(event);

          const eventName =
            interestSelect.options[interestSelect.selectedIndex].text;
          showSelectionNotification(eventName);

          document.querySelector("input")?.focus();
        }
      }, 800);
    }
  }

  // Add click handler for register buttons
  document.addEventListener("click", function (e) {
    if (
      e.target.classList.contains("register-from-popup") ||
      (e.target.closest(".btn") && e.target.closest(".event-popup-cta"))
    ) {
      e.preventDefault();
      const eventValue =
        e.target.getAttribute("data-event") ||
        e.target.closest(".btn").getAttribute("data-event");
      scrollToRegistration(eventValue);
    }
  });

  // Close popup handlers
  closePopup.addEventListener("click", () => {
    eventPopup.classList.remove("active");
    document.body.style.overflow = "";
  });

  eventPopup.addEventListener("click", (e) => {
    if (e.target === eventPopup) {
      eventPopup.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && eventPopup.classList.contains("active")) {
      eventPopup.classList.remove("active");
      document.body.style.overflow = "";
    }
  });
}

function showSelectionNotification(eventName) {
  const existingNotif = document.querySelector(".selection-notification");
  if (existingNotif) existingNotif.remove();

  const notification = document.createElement("div");
  notification.className = "selection-notification";
  notification.innerHTML = `
    <span>✓</span>
    <p>"${eventName}" has been selected in the registration form.</p>
  `;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 100);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);

  notification.addEventListener("click", () => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  });
}
