import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query,
  doc,
  updateDoc,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

document.addEventListener("DOMContentLoaded", function () {

  // Define currentReservation at the scope of the DOMContentLoaded event
  let currentReservation = {};  

  const firebaseConfig = {
    apiKey: "AIzaSyD-M5JKGaaEKOBGx_o-BzTHvPpqAyvLyc",
    authDomain: "vidyutkshetra.firebaseapp.com",
    databaseURL: "https://vidyutkshetra-default-rtdb.firebaseio.com",
    projectId: "vidyutkshetra",
    storageBucket: "vidyutkshetra.firebasestorage.app",
    messagingSenderId: "678792001265",
    appId: "1:678792001265:web:10c8f7b15dc6df1b8d9b50",
    measurementId: "G-XPD5TJ4ELZ"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const storage = getStorage(app);


  // Constants
  const MAX_FILE_SIZE_MB = 2; // Maximum file size in MB
  const COMPRESSION_QUALITY = 0.6; // Image compression quality (0.1 to 1)
  const MAX_IMAGE_WIDTH = 1200; // Maximum width for images

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
    const eventRef = collection(db, "registrations", interest, "participants");

    try {
      const q = query(eventRef);
      const querySnapshot = await getDocs(q);
      const count = querySnapshot.size + 1;
      const uniqueID = `${eventCode}-${String(count).padStart(3, "0")}`;

      // Store in Firestore
      await addDoc(eventRef, {
        name,
        email,
        phone,
        event: interest,
        eventCode,
        uniqueID,
        timestamp: serverTimestamp(),
        registrationStatus: "reserved",
      });

      // Set current reservation
      currentReservation = {
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
    updateRegistrationStatus(currentReservation.event, currentReservation.uniqueID, "on-spot");
  });

  // Update registration status in Firestore
  async function updateRegistrationStatus(eventType, uniqueID, status) {
    try {
      const eventRef = collection(db, "registrations", eventType, "participants");
      const q = query(eventRef);
      const querySnapshot = await getDocs(q);
      
      let docId = null;
      querySnapshot.forEach((doc) => {
        if (doc.data().uniqueID === uniqueID) {
          docId = doc.id;
        }
      });
      
      if (docId) {
        const docRef = doc(db, "registrations", eventType, "participants", docId);
        await updateDoc(docRef, {
          registrationStatus: status,
          lastUpdated: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
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

  // Compress image function
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
          
          // Get compressed image as Blob
          canvas.toBlob(
            (blob) => {
              resolve(blob);
            },
            file.type,
            COMPRESSION_QUALITY
          );
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
      // 1. Upload payment screenshot to Firebase Storage if available
      let screenshotURL = "";
      if (paymentScreenshotFile) {
        // Compress image before uploading
        const compressedImageBlob = await compressImage(paymentScreenshotFile);
        
        // Create a new File object with the compressed data
        const compressedFile = new File(
          [compressedImageBlob], 
          paymentScreenshotFile.name, 
          { type: paymentScreenshotFile.type }
        );
        
        // Log compression results
        console.log(`Original size: ${paymentScreenshotFile.size / 1024} KB, Compressed size: ${compressedFile.size / 1024} KB`);
        
        const storageRef = ref(storage, `payment-proofs/${currentReservation.uniqueID}-${Date.now()}`);
        await uploadBytes(storageRef, compressedFile);
        screenshotURL = await getDownloadURL(storageRef);
      }
      
      // 2. Create payment record in Firestore
      const paymentRef = collection(db, "payments");
      const paymentData = {
        uniqueID: currentReservation.uniqueID,
        event: currentReservation.event,
        eventName: currentReservation.eventName,
        teamName: teamName,
        teamMembers: teamMembers,
        amount: currentReservation.price,
        transactionId: transactionId,
        paymentProofURL: screenshotURL,
        timestamp: serverTimestamp(),
        paymentStatus: "pending",  // Can be updated to "verified" later
      };
      
      await addDoc(paymentRef, paymentData);
      
      // 3. Update registration status
      await updateRegistrationStatus(currentReservation.event, currentReservation.uniqueID, "paid");
      
      // 4. Store team details
      const teamRef = collection(db, "teams");
      const teamData = {
        uniqueID: currentReservation.uniqueID,
        teamName: teamName,
        event: currentReservation.event,
        eventName: currentReservation.eventName,
        teamMembers: teamMembers,
        leadEmail: currentReservation.email,
        leadPhone: currentReservation.phone,
        timestamp: serverTimestamp()
      };
      
      await addDoc(teamRef, teamData);

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

  // Initialize form fields based on URL hash
  function initFromUrl() {
    if (window.location.hash === "#register" && currentReservation) {
      document.getElementById("reserve").style.display = "none";
      document.getElementById("register").style.display = "block";
      setupRegistrationForm(currentReservation);
    }
  }

  initFromUrl();
});