import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  limit,
  doc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  // Configuration and Initialization
  const firebaseConfig = {
    apiKey: "AIzaSyD-M5JKGaaEKOBGx_o-BzTHvPpqAyvLyc",
    authDomain: "vidyutkshetra.firebaseapp.com",
    projectId: "vidyutkshetra",
    messagingSenderId: "678792001265",
    appId: "1:678792001265:web:10c8f7b15dc6df1b8d9b50",
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Constants
  const REGISTRATIONS_COLLECTION = "registrations";
  const MAX_FILE_SIZE_MB = 2;
  const MAX_IMAGE_WIDTH = 1200;
  const COMPRESSION_QUALITY = 0.7;
  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_QUERY_LIMIT = 50;

  // Event Pricing and Codes
  const eventPrices = {
    Coding: 199,
    IT_Quiz: 199,
    Bgmi: 399,
    Free_Fire: 299,
    Treasure: 399,
    Ipl: 399,
    Escape: 149,
    Startup: 199,
    VedaVision: 100,
  };

  const eventCodes = {
    Coding: {
      code: "VK-HS",
      groupLink: "https://chat.whatsapp.com/Em43SYWFqtr0CJatpRmFGi",
      name: "HackSutra (Coding & Debugging)",
    },
    Bgmi: {
      code: "VK-K1",
      groupLink: "https://chat.whatsapp.com/Em43SYWFqtr0CJatpRmFGi",
      name: "KuruKshetra 1 (BGMI)",
    },
    Free_Fire: {
      code: "VK-K2",
      groupLink: "https://chat.whatsapp.com/Em43SYWFqtr0CJatpRmFGi",
      name: "KuruKshetra 2 (Free Fire)",
    },
    IT_Quiz: {
      code: "VK-YP",
      groupLink: "https://chat.whatsapp.com/Em43SYWFqtr0CJatpRmFGi",
      name: "Yaksha Prashna (IT Quiz)",
    },
    Treasure: {
      code: "VK-SQ",
      groupLink: "https://chat.whatsapp.com/Em43SYWFqtr0CJatpRmFGi",
      name: "Sanjeevini Quest (Treasure Hunt)",
    },
    Ipl: {
      code: "VK-RY",
      groupLink: "https://chat.whatsapp.com/Em43SYWFqtr0CJatpRmFGi",
      name: "RajaSuya Yaga (IPL Auction)",
    },
    Escape: {
      code: "VK-CV",
      groupLink: "https://chat.whatsapp.com/Em43SYWFqtr0CJatpRmFGi",
      name: "Chakravyuha (Escape Room)",
    },
    Startup: {
      code: "VK-DJ",
      groupLink: "https://chat.whatsapp.com/Em43SYWFqtr0CJatpRmFGi",
      name: "DevaJanma (Start Up)",
    },
    VedaVision: {
      code: "VK-VV",
      groupLink: "https://chat.whatsapp.com/Em43SYWFqtr0CJatpRmFGi",
      name: "Veda Vision (Photography/Videography)",
    },
  };

  // State Management
  let currentReservation = {};
  const registrationCounts = {};

  initializeForms();
  showCheckReservationForm();

  function handleRegisterNow(e) {
    e.preventDefault();

    // Hide the confirmation and show the registration form
    document.getElementById("reservation-confirmation").style.display = "none";

    // Setup the registration form with the current reservation data
    setupRegistrationForm(currentReservation);

    // Show the registration form
    document.getElementById("register").style.display = "block";

    const registerSection = document.getElementById("register");
    if (registerSection) {
      const headerHeight = document.querySelector(".header")?.offsetHeight || 0;
      const targetPosition = registerSection.offsetTop - headerHeight - 20;

      window.scrollTo({
        top: targetPosition,
        behavior: "smooth",
      });
    }
  }
  function initializeForms() {
    document
      .getElementById("check-reservation-form")
      .addEventListener("submit", handleCheckReservation);
    document
      .getElementById("new-reservation-btn")
      .addEventListener("click", showReservationForm);

    // New Reservation Form
    document
      .getElementById("reservation-form")
      .addEventListener("submit", handleNewReservation);

    // Registration Form
    document
      .getElementById("register-now-btn")
      .addEventListener("click", handleRegisterNow);
    document
      .getElementById("pay-now-btn")
      .addEventListener("click", handlePayNow);
    document
      .getElementById("onspot-btn")
      .addEventListener("click", handleOnSpotRegistration);

    // Payment Form
    document
      .getElementById("payment-form")
      .addEventListener("submit", handlePaymentSubmission);
    document
      .getElementById("payment-screenshot")
      .addEventListener("change", handleFileUpload);
    document
      .querySelector(".copy-upi-btn")
      .addEventListener("click", copyUPIId);
  }

  // Form Visibility Control
  function showCheckReservationForm() {
    document.getElementById("reserve").style.display = "none";
    document.getElementById("register").style.display = "none";
    document.getElementById("reservation-confirmation").style.display = "none";
    document.getElementById("check-reservation").style.display = "block";
  }

  function showReservationForm() {
    document.getElementById("check-reservation").style.display = "none";
    document.getElementById("reserve").style.display = "block";
  }

  // Form Handlers
  async function handleCheckReservation(e) {
    e.preventDefault();
    const uniqueID = document.getElementById("existing-unique-id").value.trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Checking...';

      const registration = await findRegistrationByUniqueID(uniqueID);

      if (!registration) {
        throw new Error(
          "No reservation found with this ID. Please create a new one."
        );
      }

      if (registration.status === "p") {
        throw new Error("This reservation is already completed.");
      }

      currentReservation = {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        phone: registration.phone,
        event: registration.event,
        eventName: registration.eventName,
        price: registration.amount,
        uniqueID: registration.uniqueID,
        groupLink: registration.groupLink,
        status: registration.status,
      };

      document.getElementById("check-reservation").style.display = "none";
      setupRegistrationForm(currentReservation);
      document.getElementById("register").style.display = "block";

      showNotification(
        "Reservation verified! Please complete registration.",
        "success"
      );
    } catch (error) {
      showNotification(
        error.message,
        error.message.includes("completed") ? "info" : "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }

  async function handleNewReservation(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    const name = document.getElementById("reserve-name").value.trim();
    const email = document.getElementById("reserve-email").value.trim();
    const phone = document.getElementById("reserve-phone").value.trim();
    const interest = document.getElementById("reserve-interest").value.trim();

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Processing...';

      if (!validateReservationForm(name, email, phone, interest)) return;

      const eventInfo = eventCodes[interest];
      const count = await getRegistrationCount(interest);
      const uniqueID = `${eventInfo.code}-${String(count).padStart(3, "0")}`;

      const docRef = await addDoc(collection(db, REGISTRATIONS_COLLECTION), {
        name,
        email,
        phone,
        event: interest,
        eventName: eventInfo.name,
        uniqueID,
        timestamp: serverTimestamp(),
        status: "r",
        amount: eventPrices[interest],
        groupLink: eventInfo.groupLink,
      });

      currentReservation = {
        id: docRef.id,
        name,
        email,
        phone,
        event: interest,
        eventName: eventInfo.name,
        price: eventPrices[interest],
        uniqueID,
        groupLink: eventInfo.groupLink,
      };

      showReservationConfirmation(currentReservation);
      form.reset();
    } catch (error) {
      console.error("Registration error:", error);
      showNotification("Registration failed. Please try again.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }

  function handlePayNow() {
    const teamName = document.getElementById("team-name").value.trim();
    const eventType = currentReservation.event;
    const members = getTeamMembers();

    if (!validateRegistrationForm(teamName, members, eventType)) return;

    document.getElementById("payment-event").textContent =
      currentReservation.eventName;
    document.getElementById("payment-team").textContent = teamName;
    document.getElementById(
      "payment-amount"
    ).textContent = `₹${currentReservation.price}`;
    document.getElementById("payment-popup").style.display = "flex";
  }

  async function handleOnSpotRegistration() {
    const btn = this;
    const originalText = btn.innerHTML;

    try {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

      await updateRegistrationStatus(currentReservation.id, "o", {
        onSpotRegistered: true,
        onSpotTimestamp: serverTimestamp(),
      });

      document.getElementById("reservation-confirmation").style.display =
        "none";
      showNotification(
        `On-spot registration confirmed! Your ID: ${currentReservation.uniqueID}`,
        "success"
      );

      if (currentReservation.groupLink) {
        showGroupLink(currentReservation.groupLink);
      }
    } catch (error) {
      console.error("On-spot registration error:", error);
      showNotification(
        "Failed to confirm on-spot registration. Please try again.",
        "error"
      );
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  async function handlePaymentSubmission(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    const teamName = document.getElementById("team-name").value.trim();
    const transactionId = document
      .getElementById("transaction-id")
      .value.trim();
    const paymentScreenshotFile =
      document.getElementById("payment-screenshot").files[0];
    const members = getTeamMembers();

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Processing...';

      if (
        !validatePaymentForm(
          teamName,
          transactionId,
          paymentScreenshotFile,
          members
        )
      )
        return;

      const updateData = {
        team: teamName,
        members: members,
        txnId: transactionId,
        paymentTimestamp: serverTimestamp(),
        status: "p",
      };

      if (paymentScreenshotFile) {
        showNotification("Processing payment screenshot...", "info");
        updateData.paymentScreenshot = await compressImage(
          paymentScreenshotFile
        );
      }

      await updateRegistrationStatus(currentReservation.id, "p", updateData);
      showPaymentSuccess(currentReservation.event);

      // Reset all forms
      document.getElementById("reservation-form").reset();
      document.getElementById("registration-form").reset();
      form.reset();
      document.getElementById("file-name").textContent = "No file chosen";
      document.getElementById("image-preview-container").innerHTML = "";
      document.getElementById("payment-popup").style.display = "none";
    } catch (error) {
      console.error("Payment error:", error);
      showNotification(
        error.message || "Payment processing failed. Please try again.",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  }

  // Helper Functions
  function getTeamMembers() {
    const members = [document.getElementById("member1").value.trim()];
    for (let i = 2; i <= 4; i++) {
      const member = document.getElementById(`member${i}`);
      if (member) members.push(member.value.trim());
    }
    return members;
  }

  async function getRegistrationCount(eventType) {
    if (!registrationCounts[eventType]) {
      const q = query(
        collection(db, REGISTRATIONS_COLLECTION),
        where("event", "==", eventType),
        limit(MAX_QUERY_LIMIT)
      );
      const querySnapshot = await getDocs(q);
      registrationCounts[eventType] = querySnapshot.size;
    }
    return ++registrationCounts[eventType];
  }

  async function findRegistrationByUniqueID(uniqueID) {
    const q = query(
      collection(db, REGISTRATIONS_COLLECTION),
      where("uniqueID", "==", uniqueID),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty
      ? null
      : { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  }

  async function updateRegistrationStatus(docId, status, additionalData = {}) {
    const docRef = doc(db, REGISTRATIONS_COLLECTION, docId);
    await updateDoc(docRef, {
      status,
      updated: serverTimestamp(),
      ...additionalData,
    });
  }

  // Validation Functions
  function validateReservationForm(name, email, phone, interest) {
    if (!name || name.length < 3) {
      showNotification("Please enter a valid name (min 3 characters)", "error");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showNotification("Please enter a valid email address", "error");
      return false;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
      showNotification(
        "Please enter a valid 10-digit Indian phone number",
        "error"
      );
      return false;
    }

    if (!interest || !eventCodes[interest]) {
      showNotification("Please select an event to participate in", "error");
      return false;
    }

    return true;
  }

  function validateRegistrationForm(teamName, members, eventType) {
    if (!teamName || teamName.length < 3) {
      showNotification(
        "Please enter a valid team name (min 3 characters)",
        "error"
      );
      return false;
    }

    const duoEvents = ["Coding", "IT_Quiz", "Escape", "Startup", "VedaVision"];
    const squadEvents = ["Bgmi", "Free_Fire", "Treasure", "Ipl"];

    if (duoEvents.includes(eventType)) {
      if (members.length < 2 || members.some((m) => !m || m.length < 3)) {
        showNotification(
          "Please enter valid details for all team members",
          "error"
        );
        return false;
      }
    } else if (squadEvents.includes(eventType)) {
      if (members.length < 4 || members.some((m) => !m || m.length < 3)) {
        showNotification(
          "Please enter valid details for all 4 team members",
          "error"
        );
        return false;
      }
    }

    return true;
  }

  function validatePaymentForm(
    teamName,
    transactionId,
    paymentScreenshotFile,
    members
  ) {
    if (
      !validateRegistrationForm(teamName, members, currentReservation.event)
    ) {
      return false;
    }

    if (!transactionId || transactionId.length < 6) {
      showNotification(
        "Please enter a valid transaction ID (min 6 characters)",
        "error"
      );
      return false;
    }

    if (!paymentScreenshotFile) {
      showNotification("Please upload a payment screenshot", "error");
      return false;
    }

    return true;
  }

  // File Handling
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    const fileNameElement = document.getElementById("file-name");
    const previewContainer =
      document.getElementById("image-preview-container") ||
      createPreviewContainer();

    previewContainer.innerHTML = "";
    fileNameElement.textContent = "No file chosen";

    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      showNotification("Please upload a JPEG, PNG, or WebP image", "error");
      e.target.value = "";
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      showNotification(`File exceeds ${MAX_FILE_SIZE_MB}MB limit`, "error");
      e.target.value = "";
      return;
    }

    fileNameElement.textContent = "Processing image...";
    previewContainer.innerHTML = '<div class="loading-spinner"></div>';

    try {
      const preview = await createImagePreview(file, previewContainer);
      fileNameElement.textContent = `${file.name} (${
        Math.round(fileSizeMB * 100) / 100
      }MB)`;

      const dimensionsInfo = document.createElement("div");
      dimensionsInfo.className = "image-dimensions";
      dimensionsInfo.textContent = `Dimensions: ${preview.naturalWidth}×${preview.naturalHeight}px`;
      previewContainer.appendChild(dimensionsInfo);
    } catch (error) {
      console.error("Image processing error:", error);
      showNotification(
        "Failed to process image. Please try another file.",
        "error"
      );
      e.target.value = "";
      previewContainer.innerHTML = "";
    }
  }

  function createImagePreview(file, container) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;

        img.onload = function () {
          container.innerHTML = "";

          const previewImg = document.createElement("img");
          previewImg.src = event.target.result;
          previewImg.style.maxWidth = "100%";
          previewImg.style.maxHeight = "300px";
          previewImg.style.borderRadius = "4px";
          previewImg.alt = "Payment screenshot preview";

          container.appendChild(previewImg);
          resolve(img);
        };

        img.onerror = function () {
          reject(new Error("Failed to load image"));
        };
      };

      reader.onerror = function () {
        reject(new Error("Failed to read file"));
      };
    });
  }

  async function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;

        img.onload = function () {
          let width = img.width;
          let height = img.height;
          let quality = COMPRESSION_QUALITY;

          // Adjust quality based on original size
          const originalSizeMB = file.size / (1024 * 1024);
          if (originalSizeMB < 1) quality = 0.8;
          else if (originalSizeMB > 3) quality = 0.5;

          if (width > MAX_IMAGE_WIDTH) {
            const ratio = MAX_IMAGE_WIDTH / width;
            width = MAX_IMAGE_WIDTH;
            height = height * ratio;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          const base64Image = canvas.toDataURL(file.type, quality);
          resolve(base64Image);
        };

        img.onerror = function () {
          reject(new Error("Failed to load image"));
        };
      };

      reader.onerror = function () {
        reject(new Error("Failed to read file"));
      };
    });
  }

  // UI Functions
  function showReservationConfirmation(reservation) {
    document.getElementById("unique-key-value").textContent =
      reservation.uniqueID;
    document.getElementById("reserved-name").textContent = reservation.name;
    document.getElementById("reserved-event").textContent =
      reservation.eventName;
    document.getElementById(
      "reserved-price"
    ).textContent = `₹${reservation.price}`;

    document.getElementById("reserve").style.display = "none";
    document.getElementById("reservation-confirmation").style.display = "block";
  }

  function setupRegistrationForm(reservation) {
    document.getElementById("unique-id").value = reservation.uniqueID;
    document.getElementById("reg-name").value = reservation.name;
    document.getElementById("reg-email").value = reservation.email;
    document.getElementById("reg-phone").value = reservation.phone;
    document.getElementById("reg-event").value = reservation.eventName;
    document.getElementById("member1").value = reservation.name;

    setupTeamFields(reservation.event);
  }

  function setupTeamFields(eventType) {
    const container = document.getElementById("additional-members-container");
    container.innerHTML = "";

    if (["Coding", "IT_Quiz", "Escape", "Startup"].includes(eventType)) {
      container.innerHTML = `
        <div class="form-group">
          <label for="member2">Team Member 2</label>
          <input type="text" id="member2" name="member2" required>
        </div>
      `;
    } else if (["Bgmi", "Free_Fire", "Treasure", "Ipl"].includes(eventType)) {
      container.innerHTML = `
        <div class="form-group">
          <label for="member2">Team Member 2</label>
          <input type="text" id="member2" name="member2" required>
        </div>
        <div class="form-group">
          <label for="member3">Team Member 3</label>
          <input type="text" id="member3" name="member3" required>
        </div>
        <div class="form-group">
          <label for="member4">Team Member 4</label>
          <input type="text" id="member4" name="member4" required>
        </div>
      `;
    }
  }

  function showPaymentSuccess(eventType) {
    const eventInfo = eventCodes[eventType];
    const successPopup = document.createElement("div");
    successPopup.className = "payment-success-popup";
    successPopup.innerHTML = `
      <div class="success-content">
        <i class="fas fa-check-circle"></i>
        <h3>Registration Successful!</h3>
        <p>Your registration for ${eventInfo.name} has been confirmed.</p>
        
        <div class="group-join-section">
          <h4>Join the Event Group</h4>
          <p>Connect with other participants and get event updates:</p>
          <a href="${eventInfo.groupLink}" target="_blank" class="join-group-btn">
            <i class="fab fa-whatsapp"></i> Join WhatsApp Group
          </a>
          <p class="note">Note: This group is for participants only.</p>
        </div>
        
        <button class="close-success-btn">Close</button>
      </div>
    `;

    document.body.appendChild(successPopup);
    successPopup
      .querySelector(".close-success-btn")
      .addEventListener("click", () => {
        successPopup.remove();
        showCheckReservationForm();
      });

    successPopup.addEventListener("click", (e) => {
      if (e.target === successPopup) {
        successPopup.remove();
        showCheckReservationForm();
      }
    });
  }

  function showGroupLink(link) {
    const groupLinkDiv = document.createElement("div");
    groupLinkDiv.className = "group-link-notification";
    groupLinkDiv.innerHTML = `
      <p>Join the event WhatsApp group for updates:</p>
      <a href="${link}" target="_blank" class="whatsapp-link">
        <i class="fab fa-whatsapp"></i> Join Group
      </a>
    `;

    document.body.appendChild(groupLinkDiv);
    setTimeout(() => groupLinkDiv.classList.add("show"), 100);
    setTimeout(() => {
      groupLinkDiv.classList.remove("show");
      setTimeout(() => groupLinkDiv.remove(), 300);
    }, 10000);
  }

  function copyUPIId() {
    const upiId = "vidyutkshetra@upi";
    navigator.clipboard
      .writeText(upiId)
      .then(() => {
        const btn = this;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.backgroundColor = "#4CAF50";

        setTimeout(() => {
          btn.innerHTML = '<i class="far fa-copy"></i>';
          btn.style.backgroundColor = "";
        }, 2000);

        showNotification("UPI ID copied to clipboard!", "success");
      })
      .catch((err) => {
        console.error("Failed to copy UPI ID:", err);
        showNotification(
          "Failed to copy UPI ID. Please copy manually.",
          "error"
        );
      });
  }

  function createPreviewContainer() {
    const container = document.createElement("div");
    container.id = "image-preview-container";
    container.style.margin = "10px 0";
    container.style.textAlign = "center";

    const fileInput = document.getElementById("payment-screenshot");
    fileInput.parentNode.insertBefore(container, fileInput.nextSibling);

    return container;
  }

  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <span>${type === "error" ? "✗" : "✓"}</span>
      <p>${message}</p>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add("show"), 100);
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
});
