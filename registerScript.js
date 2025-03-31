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
  where 
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
  };

  const eventCodes = {
    "Coding": "VK-HS",
    "Bgmi": "VK-K1",
    "Free_Fire": "VK-K2",
    "IT_Quiz": "VK-YP",
    "Treasure": "VK-SQ",
    "Ipl": "VK-RY",
    "Escape": "VK-CV",
    "Startup": "VK-DJ"
  };

  // Cache for storing registration counts to minimize Firestore reads
  const registrationCounts = {};

  document.getElementById("reservation-form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("reserve-name").value.trim();
    const email = document.getElementById("reserve-email").value.trim();
    const phone = document.getElementById("reserve-phone").value.trim();
    const interest = document.getElementById("reserve-interest").value.trim();

    if (!interest || !eventCodes[interest]) {
      alert("⚠️ Please select a valid event.");
      return;
    }

    const eventCode = eventCodes[interest];
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
      const uniqueID = `${eventCode}-${String(count).padStart(3, "0")}`;

      // Store in Firestore - single document with minimal fields
      const docRef = await addDoc(registrationsRef, {
        name,
        email,
        phone,
        event: interest,
        eventName: document.getElementById("reserve-interest").options[
          document.getElementById("reserve-interest").selectedIndex
        ].text,
        uniqueID,
        timestamp: serverTimestamp(),
        status: "r", // r = reserved, p = paid, o = on-spot
        // Initialize fields to be populated later
        team: null,
        members: [name], // Add lead member by default
        amount: eventPrices[interest],
        txnId: null,
        paymentScreenshot: null, // Will store base64 image directly
        paymentTimestamp: null
      });

      // Set current reservation
      currentReservation = {
        id: docRef.id, // Store the Firestore document ID for easier updates
        name,
        email,
        phone,
        event: interest,
        eventName: document.getElementById("reserve-interest").options[
          document.getElementById("reserve-interest").selectedIndex
        ].text,
        price: eventPrices[interest],
        uniqueID: uniqueID
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
    document.getElementById("unique-key-value").textContent = reservation.uniqueID;
    document.getElementById("reserved-name").textContent = reservation.name;
    document.getElementById("reserved-event").textContent = reservation.eventName;
    document.getElementById("reserved-price").textContent = `₹${reservation.price}`;

    document.getElementById("reserve").style.display = "none";
    document.getElementById("reservation-confirmation").style.display = "block";
  }

  // Copy key to clipboard
  document.getElementById("copy-key-btn").addEventListener("click", function () {
    const key = document.getElementById("unique-key-value").textContent;
    navigator.clipboard.writeText(key).then(() => {
      showNotification("Unique key copied to clipboard!", "success");
    });
  });

  // Register Now button
  document.getElementById("register-now-btn").addEventListener("click", function () {
    document.getElementById("reservation-confirmation").style.display = "none";
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
        updated: serverTimestamp()
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
        ...doc.data()
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

    const duoEvents = ["Coding", "IT_Quiz", "Escape", "Startup"];
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

  // Pay Now button
  document.getElementById("pay-now-btn").addEventListener("click", function () {
    // Validate team name
    const teamName = document.getElementById("team-name").value;
    if (!teamName) {
      showNotification("Please enter your team name", "error");
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

  // File upload display and validation
  document.getElementById("payment-screenshot").addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) {
      document.getElementById("file-name").textContent = "No file chosen";
      return;
    }
    
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      showNotification(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please choose a smaller file.`, "error");
      this.value = "";
      document.getElementById("file-name").textContent = "No file chosen";
      return;
    }
    
    // Check if it's an image
    if (!file.type.match('image.*')) {
      showNotification("Please upload an image file (jpg, png, etc)", "error");
      this.value = "";
      document.getElementById("file-name").textContent = "No file chosen";
      return;
    }
    
    document.getElementById("file-name").textContent = file.name;
  });

  // Compress image and convert to base64 for storage in Firestore
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = function() {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          
          if (width > MAX_IMAGE_WIDTH) {
            const ratio = MAX_IMAGE_WIDTH / width;
            width = MAX_IMAGE_WIDTH;
            height = height * ratio;
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed image as base64 string
          const base64Image = canvas.toDataURL(file.type, COMPRESSION_QUALITY);
          resolve(base64Image);
        };
        
        img.onerror = function() {
          reject(new Error("Failed to load image"));
        };
      };
      
      reader.onerror = function() {
        reject(new Error("Failed to read file"));
      };
    });
  }

  // Copy UPI ID
  document.querySelector(".copy-upi-btn").addEventListener("click", function () {
    navigator.clipboard.writeText("vidyutkshetra@upi").then(() => {
      showNotification("UPI ID copied to clipboard!", "success");
    });
  });

  // Payment form submission
  document.getElementById("payment-form").addEventListener("submit", async function (e) {
    e.preventDefault();
    
    // Show loading indicator
    showNotification("Processing payment...", "info");

    // Get all team members
    const teamMembers = [document.getElementById("member1").value];
    if (document.getElementById("member2"))
      teamMembers.push(document.getElementById("member2").value);
    if (document.getElementById("member3"))
      teamMembers.push(document.getElementById("member3").value);
    if (document.getElementById("member4"))
      teamMembers.push(document.getElementById("member4").value);

    const teamName = document.getElementById("team-name").value;
    const transactionId = document.getElementById("transaction-id").value;
    const paymentScreenshotFile = document.getElementById("payment-screenshot").files[0];
    
    try {
      // Store data to update
      const updateData = {
        team: teamName,
        members: teamMembers,
        txnId: transactionId,
        paymentTimestamp: serverTimestamp(),
        status: "p"  // p = paid/pending confirmation
      };
      
      // Process and store screenshot if provided
      if (paymentScreenshotFile) {
        // Show progress indicator
        showNotification("Processing image...", "info");
        
        // Compress image and convert to base64
        const base64Image = await compressImage(paymentScreenshotFile);
        
        // Store base64 image directly in document
        updateData.paymentScreenshot = base64Image;
      }
      
      // Update the existing document with payment information
      const docRef = doc(db, REGISTRATIONS_COLLECTION, currentReservation.id);
      await updateDoc(docRef, updateData);
      
      showNotification("Registration completed successfully!", "success");
      document.getElementById("payment-popup").style.display = "none";

      // Reset forms
      document.getElementById("reservation-form").reset();
      document.getElementById("registration-form").reset();
      document.getElementById("payment-form").reset();
      document.getElementById("file-name").textContent = "No file chosen";

      // Show reservation form again
      document.getElementById("register").style.display = "none";
      document.getElementById("reservation-confirmation").style.display = "none";
      document.getElementById("reserve").style.display = "block";
    } catch (error) {
      console.error("Error processing payment:", error);
      showNotification("Payment processing failed. Please try again.", "error");
    }
  });

  // Function to display a payment screenshot from an existing registration
  // This can be used in an admin panel
  function displayPaymentScreenshot(registrationData) {
    if (registrationData && registrationData.paymentScreenshot) {
      const imgElement = document.createElement('img');
      imgElement.src = registrationData.paymentScreenshot;
      imgElement.style.maxWidth = '100%';
      return imgElement;
    }
    return null;
  }

  // Add a feature to preview the selected image before upload
  document.getElementById("payment-screenshot").addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
      const previewContainer = document.getElementById("image-preview-container") || createPreviewContainer();
      
      // Clear previous preview
      previewContainer.innerHTML = "";
      
      // Read and display the image
      const reader = new FileReader();
      reader.onload = function(event) {
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
    const fileInputParent = document.getElementById("payment-screenshot").parentNode;
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
    const uniqueID = urlParams.get('id');
    
    if (uniqueID) {
      // Find the registration by uniqueID
      findRegistrationByUniqueID(uniqueID).then(registration => {
        if (registration) {
          currentReservation = {
            id: registration.id,
            name: registration.name,
            email: registration.email,
            phone: registration.phone,
            event: registration.event,
            eventName: registration.eventName,
            price: registration.amount,
            uniqueID: registration.uniqueID
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
      document.querySelectorAll(".view-payment-btn").forEach(button => {
        button.addEventListener("click", async function() {
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
            closeBtn.onclick = function() {
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
            showNotification("No payment screenshot found for this registration", "error");
          }
        });
      });
    }
  }

  initFromUrl();
  
  // Call admin features setup after page is loaded
  setTimeout(addAdminFeatures, 1000);
});