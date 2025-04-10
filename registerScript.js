import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  doc,
  updateDoc,
  serverTimestamp,
  limit,
  where,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  // Define currentReservation at the scope of the DOMContentLoaded event
  let currentReservation = {};

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
  const MAX_FILE_SIZE_MB = 0.5;
  const COMPRESSION_QUALITY = 0.4;
  const MAX_IMAGE_WIDTH = 800;
  const MAX_QUERY_LIMIT = 50;

  // Single collection for all registrations
  const REGISTRATIONS_COLLECTION = "registrations";

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

  // Enhanced eventCodes object with group links
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

  // Cache for storing registration counts to minimize Firestore reads
  const registrationCounts = {};

  function validateReservationForm(name, email, phone, interest) {
    // Name validation
    if (!name || name.length < 3) {
      showNotification(
        "Please enter a valid name (at least 3 characters)",
        "error"
      );
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showNotification("Please enter a valid email address", "error");
      return false;
    }

    // Phone validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone || !phoneRegex.test(phone)) {
      showNotification("Please enter a valid 10-digit phone number", "error");
      return false;
    }

    // Event selection validation
    if (!interest || !eventCodes[interest]) {
      showNotification("Please select an event to participate in", "error");
      return false;
    }

    return true;
  }

  document
    .getElementById("reservation-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const name = document.getElementById("reserve-name").value.trim();
      const email = document.getElementById("reserve-email").value.trim();
      const phone = document.getElementById("reserve-phone").value.trim();
      const interest = document.getElementById("reserve-interest").value.trim();

      if (!validateReservationForm(name, email, phone, interest)) {
        return;
      }

      const eventInfo = eventCodes[interest];
      const registrationsRef = collection(db, REGISTRATIONS_COLLECTION);

      try {
        // Check if we have a cached count
        if (!registrationCounts[interest]) {
          // Query with limit to avoid excessive reads
          const q = query(
            registrationsRef,
            where("event", "==", interest),
            limit(MAX_QUERY_LIMIT)
          );
          const querySnapshot = await getDocs(q);
          registrationCounts[interest] = querySnapshot.size;
        }

        // Increment the count
        registrationCounts[interest]++;
        const count = registrationCounts[interest];
        const uniqueID = `${eventInfo.code}-${String(count).padStart(3, "0")}`;

        // Store in Firestore - single document with minimal fields
        const docRef = await addDoc(registrationsRef, {
          name,
          email,
          phone,
          event: interest,
          eventName: eventInfo.name,
          uniqueID,
          timestamp: serverTimestamp(),
          status: "r", // r = reserved, p = paid, o = on-spot
          // Initialize fields to be populated later
          team: null,
          members: [name], // Add lead member by default
          amount: eventPrices[interest],
          txnId: null,
          paymentScreenshot: null, // Will store base64 image directly
          paymentTimestamp: null,
          groupLink: eventInfo.groupLink, // Store group link with registration
        });

        // Set current reservation
        currentReservation = {
          id: docRef.id, // Store the Firestore document ID for easier updates
          name,
          email,
          phone,
          event: interest,
          eventName: eventInfo.name,
          price: eventPrices[interest],
          uniqueID: uniqueID,
          groupLink: eventInfo.groupLink,
        };

        // Show confirmation
        showReservationConfirmation(currentReservation);
        document.getElementById("reservation-form").reset();
      } catch (error) {
        console.error("Error registering:", error);
        alert("⚠️ Registration failed. Try again!");
      }
    });

  // Show reservation confirmation
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

  // Copy key to clipboard
  document
    .getElementById("copy-key-btn")
    .addEventListener("click", function () {
      const key = document.getElementById("unique-key-value").textContent;
      navigator.clipboard.writeText(key).then(() => {
        showNotification("Unique key copied to clipboard!", "success");
      });
    });

  // Register Now button
  document
    .getElementById("register-now-btn")
    .addEventListener("click", function () {
      document.getElementById("reservation-confirmation").style.display =
        "none";
      document.getElementById("register").style.display = "block";

      // Set up registration form with reservation data
      setupRegistrationForm(currentReservation);
    });

  // Register On-Spot button
  document.getElementById("onspot-btn").addEventListener("click", function () {
    const key = document.getElementById("unique-key-value").textContent;
    showNotification(
      `You've chosen on-spot registration. Please note your key: ${key}`,
      "info"
    );
    updateRegistrationStatus(currentReservation.id, "o");
  });

  // Update registration status in Firestore - simplified with direct document update
  async function updateRegistrationStatus(docId, status) {
    try {
      const docRef = doc(db, REGISTRATIONS_COLLECTION, docId);
      await updateDoc(docRef, {
        status: status,
        updated: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  // Find registration by unique ID
  async function findRegistrationByUniqueID(uniqueID) {
    try {
      const registrationsRef = collection(db, REGISTRATIONS_COLLECTION);
      const q = query(
        registrationsRef,
        where("uniqueID", "==", uniqueID),
        limit(1)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      console.error("Error finding registration:", error);
      return null;
    }
  }

  // Setup registration form with reservation data
  function setupRegistrationForm(reservation) {
    // Auto-fill fields
    document.getElementById("unique-id").value = reservation.uniqueID;
    document.getElementById("reg-name").value = reservation.name;
    document.getElementById("reg-email").value = reservation.email;
    document.getElementById("reg-phone").value = reservation.phone;
    document.getElementById("reg-event").value = reservation.eventName;
    document.getElementById("member1").value = reservation.name;

    // Set up dynamic team fields and pricing
    setupTeamFields(reservation.event);
  }

  // Set up team fields based on event type
  function setupTeamFields(eventType) {
    const container = document.getElementById("additional-members-container");
    container.innerHTML = "";

    // Set the price based on event type
    const price = eventPrices[eventType] || 0;
    document.getElementById("payment-amount").textContent = `₹${price}`;

    const duoEvents = ["Coding", "IT_Quiz", "Escape", "Startup", "VedaVision"];
    const squadEvents = ["Bgmi", "Free_Fire", "Treasure", "Ipl"];

    if (duoEvents.includes(eventType)) {
      container.innerHTML = `
        <div class="form-group">
          <label for="member2">Team Member 2</label>
          <input type="text" id="member2" name="member2" required>
        </div>
      `;
    } else if (squadEvents.includes(eventType)) {
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
  function validateRegistrationForm(teamName, members, eventType) {
    // Team name validation
    if (!teamName || teamName.length < 3) {
      showNotification(
        "Please enter a valid team name (at least 3 characters)",
        "error"
      );
      return false;
    }

    // Member validation based on event type
    const duoEvents = ["Coding", "IT_Quiz", "Escape", "Startup"];
    const squadEvents = ["Bgmi", "Free_Fire", "Treasure", "Ipl"];

    if (duoEvents.includes(eventType)) {
      const member2 = document.getElementById("member2").value.trim();
      if (!member2 || member2.length < 3) {
        showNotification(
          "Please enter valid details for Team Member 2",
          "error"
        );
        return false;
      }
    } else if (squadEvents.includes(eventType)) {
      const member2 = document.getElementById("member2").value.trim();
      const member3 = document.getElementById("member3").value.trim();
      const member4 = document.getElementById("member4").value.trim();

      if (
        !member2 ||
        member2.length < 3 ||
        !member3 ||
        member3.length < 3 ||
        !member4 ||
        member4.length < 3
      ) {
        showNotification(
          "Please enter valid details for all team members",
          "error"
        );
        return false;
      }
    }

    return true;
  }
  // Pay Now button
  document.getElementById("pay-now-btn").addEventListener("click", function () {
    const teamName = document.getElementById("team-name").value.trim();
    const eventType = currentReservation.event;
    const members = [document.getElementById("member1").value.trim()];

    if (document.getElementById("member2")) {
      members.push(document.getElementById("member2").value.trim());
    }
    if (document.getElementById("member3")) {
      members.push(document.getElementById("member3").value.trim());
    }
    if (document.getElementById("member4")) {
      members.push(document.getElementById("member4").value.trim());
    }

    // Validate form
    if (!validateRegistrationForm(teamName, members, eventType)) {
      return;
    }

    // Set payment details
    document.getElementById("payment-event").textContent =
      document.getElementById("reg-event").value;
    document.getElementById("payment-team").textContent = teamName;

    // Show payment popup
    document.getElementById("payment-popup").style.display = "flex";
  });

  // Close payment popup
  document.querySelector(".close-btn").addEventListener("click", function () {
    document.getElementById("payment-popup").style.display = "none";
  });

  // Constants for file validation
  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

  // Enhanced file upload display and validation
  document
    .getElementById("payment-screenshot")
    .addEventListener("change", async function (e) {
      const file = e.target.files[0];
      const fileNameElement = document.getElementById("file-name");
      const previewContainer =
        document.getElementById("image-preview-container") ||
        createPreviewContainer();

      // Clear previous preview and messages
      previewContainer.innerHTML = "";
      fileNameElement.textContent = "No file chosen";

      if (!file) {
        return;
      }

      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        showNotification(
          "Please upload a valid image (JPEG, PNG, or WebP)",
          "error"
        );
        this.value = "";
        return;
      }

      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        showNotification(
          `File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please choose a smaller file.`,
          "error"
        );
        this.value = "";
        return;
      }

      // Show loading state
      fileNameElement.textContent = "Processing image...";
      previewContainer.innerHTML = '<div class="loading-spinner"></div>';

      try {
        // Create preview and get dimensions
        const preview = await createImagePreview(file, previewContainer);
        fileNameElement.textContent = `${file.name} (${
          Math.round(fileSizeMB * 100) / 100
        }MB)`;

        // Show dimensions info
        const dimensionsInfo = document.createElement("div");
        dimensionsInfo.className = "image-dimensions";
        dimensionsInfo.textContent = `Dimensions: ${preview.naturalWidth}×${preview.naturalHeight}px`;
        previewContainer.appendChild(dimensionsInfo);
      } catch (error) {
        console.error("Error processing image:", error);
        showNotification(
          "Failed to process image. Please try another file.",
          "error"
        );
        this.value = "";
        previewContainer.innerHTML = "";
      }
    });

  // Improved image preview creation
  function createImagePreview(file, container) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;

        img.onload = function () {
          container.innerHTML = "";

          // Create preview image
          const previewImg = document.createElement("img");
          previewImg.src = event.target.result;
          previewImg.style.maxWidth = "100%";
          previewImg.style.maxHeight = "300px";
          previewImg.style.borderRadius = "4px";
          previewImg.alt = "Payment screenshot preview";

          container.appendChild(previewImg);
          resolve(img); // Resolve with the full image for dimensions
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

  // Enhanced image compression with better quality handling
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;

        img.onload = function () {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          let quality = COMPRESSION_QUALITY;

          // Adjust quality based on original file size
          const originalSizeMB = file.size / (1024 * 1024);
          if (originalSizeMB < 1) {
            quality = 0.8; // Higher quality for already small files
          } else if (originalSizeMB > 3) {
            quality = 0.5; // More compression for very large files
          }

          if (width > MAX_IMAGE_WIDTH) {
            const ratio = MAX_IMAGE_WIDTH / width;
            width = MAX_IMAGE_WIDTH;
            height = height * ratio;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          // Higher quality canvas settings
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Get compressed image as base64 string
          const base64Image = canvas.toDataURL(file.type, quality);

          // Verify compressed size
          const compressedSizeMB = (base64Image.length * 3) / 4 / (1024 * 1024);
          if (compressedSizeMB > MAX_FILE_SIZE_MB) {
            // If still too large, try again with lower quality
            return resolve(compressImageWithQuality(file, quality * 0.7));
          }

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

  // Helper function for recursive compression with lower quality
  function compressImageWithQuality(file, quality) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);

      img.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Reduce dimensions further if needed
        let width = img.width;
        let height = img.height;
        if (width > MAX_IMAGE_WIDTH * 0.8) {
          width = MAX_IMAGE_WIDTH * 0.8;
          height = (img.height / img.width) * width;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const base64Image = canvas.toDataURL(file.type, quality);
        resolve(base64Image);
      };
    });
  }

  // Enhanced payment form submission with better validation
  document
    .getElementById("payment-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      // Validate form first
      const teamName = document.getElementById("team-name").value.trim();
      const transactionId = document
        .getElementById("transaction-id")
        .value.trim();
      const paymentScreenshotFile =
        document.getElementById("payment-screenshot").files[0];

      if (!teamName || teamName.length < 3) {
        showNotification(
          "Please enter a valid team name (min 3 characters)",
          "error"
        );
        document.getElementById("team-name").focus();
        return;
      }

      if (!transactionId || transactionId.length < 6) {
        showNotification(
          "Please enter a valid transaction ID (min 6 characters)",
          "error"
        );
        document.getElementById("transaction-id").focus();
        return;
      }

      if (!paymentScreenshotFile) {
        showNotification("Please upload a payment screenshot", "error");
        return;
      }

      // Show loading state
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Processing...';

      try {
        // Get all team members with validation
        const teamMembers = [document.getElementById("member1").value.trim()];
        const memberFields = ["member2", "member3", "member4"];

        for (const field of memberFields) {
          const element = document.getElementById(field);
          if (element) {
            const value = element.value.trim();
            if (!value || value.length < 3) {
              throw new Error(
                `Please enter valid details for all team members (min 3 characters each)`
              );
            }
            teamMembers.push(value);
          }
        }

        // Prepare update data
        const updateData = {
          team: teamName,
          members: teamMembers,
          txnId: transactionId,
          paymentTimestamp: serverTimestamp(),
          status: "p", // p = paid/pending confirmation
        };

        // Process and store screenshot
        showNotification("Compressing and uploading image...", "info");
        const base64Image = await compressImage(paymentScreenshotFile);
        updateData.paymentScreenshot = base64Image;

        // Update Firestore document
        const docRef = doc(db, REGISTRATIONS_COLLECTION, currentReservation.id);
        await updateDoc(docRef, updateData);

        // Show success
        showPaymentSuccess(currentReservation.event);

        // Reset forms
        document.getElementById("reservation-form").reset();
        document.getElementById("registration-form").reset();
        this.reset();
        document.getElementById("file-name").textContent = "No file chosen";
        document.getElementById("image-preview-container").innerHTML = "";

        // Hide payment popup
        document.getElementById("payment-popup").style.display = "none";
      } catch (error) {
        console.error("Payment processing error:", error);
        showNotification(
          error.message || "Payment processing failed. Please try again.",
          "error"
        );
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });

  // Helper function to create preview container
  function createPreviewContainer() {
    const container = document.createElement("div");
    container.id = "image-preview-container";
    container.style.margin = "10px 0";
    container.style.textAlign = "center";

    const fileInput = document.getElementById("payment-screenshot");
    fileInput.parentNode.insertBefore(container, fileInput.nextSibling);

    return container;
  }

  // Enhanced UPI ID copy functionality
  document
    .querySelector(".copy-upi-btn")
    .addEventListener("click", function () {
      const upiId = "vidyutkshetra@upi";

      navigator.clipboard
        .writeText(upiId)
        .then(() => {
          // Visual feedback
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
    });

  // Show payment success with group link
  function showPaymentSuccess(eventType) {
    const eventInfo = eventCodes[eventType];

    // Create success popup
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

    // Close button handler
    successPopup
      .querySelector(".close-success-btn")
      .addEventListener("click", () => {
        successPopup.remove();
        // Show reservation form again
        document.getElementById("register").style.display = "none";
        document.getElementById("reservation-confirmation").style.display =
          "none";
        document.getElementById("reserve").style.display = "block";
      });

    // Also close when clicking outside
    successPopup.addEventListener("click", (e) => {
      if (e.target === successPopup) {
        successPopup.remove();
        // Show reservation form again
        document.getElementById("register").style.display = "none";
        document.getElementById("reservation-confirmation").style.display =
          "none";
        document.getElementById("reserve").style.display = "block";
      }
    });
  }

  // Function to display a payment screenshot from an existing registration
  function displayPaymentScreenshot(registrationData) {
    if (registrationData && registrationData.paymentScreenshot) {
      const imgElement = document.createElement("img");
      imgElement.src = registrationData.paymentScreenshot;
      imgElement.style.maxWidth = "100%";
      return imgElement;
    }
    return null;
  }

  // Add a feature to preview the selected image before upload
  document
    .getElementById("payment-screenshot")
    .addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const previewContainer =
          document.getElementById("image-preview-container") ||
          createPreviewContainer();

        // Clear previous preview
        previewContainer.innerHTML = "";

        // Read and display the image
        const reader = new FileReader();
        reader.onload = function (event) {
          const img = document.createElement("img");
          img.src = event.target.result;
          img.style.maxWidth = "100%";
          img.style.maxHeight = "200px";
          img.style.borderRadius = "4px";
          previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
      }
    });

  // Create image preview container if it doesn't exist
  function createPreviewContainer() {
    const container = document.createElement("div");
    container.id = "image-preview-container";
    container.style.marginTop = "10px";
    container.style.marginBottom = "10px";

    // Insert before submit button
    const fileInputParent =
      document.getElementById("payment-screenshot").parentNode;
    fileInputParent.appendChild(container);

    return container;
  }

  // Show notification
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
    }, 3000);
  }

  // Initialize form fields based on URL hash or parameters
  function initFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const uniqueID = urlParams.get("id");

    if (uniqueID) {
      // Find the registration by uniqueID
      findRegistrationByUniqueID(uniqueID).then((registration) => {
        if (registration) {
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
          };

          if (window.location.hash === "#register") {
            document.getElementById("reserve").style.display = "none";
            document.getElementById("register").style.display = "block";
            setupRegistrationForm(currentReservation);
          } else {
            showReservationConfirmation(currentReservation);
          }
        }
      });
    }
  }

  // Add a payment verification feature for admin panel
  function addAdminFeatures() {
    // Check if admin panel exists
    const adminPanel = document.getElementById("admin-panel");
    if (adminPanel) {
      // Add verification buttons event listeners
      document.querySelectorAll(".view-payment-btn").forEach((button) => {
        button.addEventListener("click", async function () {
          const uniqueID = this.getAttribute("data-id");
          const registration = await findRegistrationByUniqueID(uniqueID);

          if (registration && registration.paymentScreenshot) {
            // Display the payment screenshot in a modal
            const modal = document.createElement("div");
            modal.className = "modal";
            modal.style.display = "flex";
            modal.style.position = "fixed";
            modal.style.top = "0";
            modal.style.left = "0";
            modal.style.width = "100%";
            modal.style.height = "100%";
            modal.style.backgroundColor = "rgba(0,0,0,0.7)";
            modal.style.justifyContent = "center";
            modal.style.alignItems = "center";
            modal.style.zIndex = "1000";

            const modalContent = document.createElement("div");
            modalContent.style.backgroundColor = "#fff";
            modalContent.style.padding = "20px";
            modalContent.style.borderRadius = "8px";
            modalContent.style.maxWidth = "80%";
            modalContent.style.maxHeight = "80%";
            modalContent.style.overflow = "auto";

            const closeBtn = document.createElement("button");
            closeBtn.textContent = "✕";
            closeBtn.style.float = "right";
            closeBtn.style.border = "none";
            closeBtn.style.background = "none";
            closeBtn.style.fontSize = "20px";
            closeBtn.style.cursor = "pointer";
            closeBtn.onclick = function () {
              document.body.removeChild(modal);
            };

            const img = document.createElement("img");
            img.src = registration.paymentScreenshot;
            img.style.maxWidth = "100%";
            img.style.display = "block";
            img.style.marginTop = "20px";

            modalContent.appendChild(closeBtn);
            modalContent.appendChild(document.createElement("br"));
            modalContent.appendChild(img);
            modal.appendChild(modalContent);

            document.body.appendChild(modal);
          } else {
            showNotification(
              "No payment screenshot found for this registration",
              "error"
            );
          }
        });
      });
    }
  }

  initFromUrl();

  // Call admin features setup after page is loaded
  setTimeout(addAdminFeatures, 1000);
});
