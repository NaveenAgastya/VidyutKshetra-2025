document.addEventListener("DOMContentLoaded", function () {
    // Event prices 
    const eventPrices = {
      coding: 250,
      quiz: 250,
      bgmi: 400,
      freefire: 300,
      treasure: 400,
      ipl: 400,
      escape: 200,
      startup: 200,
    };
  

    let currentReservation = null;
  
    // Handle reservation form submission
    document
      .getElementById("reservation-form")
      .addEventListener("submit", function (e) {
        e.preventDefault();
  
        // Generate unique key (in production, this would come from backend)
        const uniqueKey = "VK-" + Date.now().toString().slice(-6);
        const eventValue = document.getElementById("reserve-interest").value;
  
        // Store reservation data
        currentReservation = {
          key: uniqueKey,
          name: document.getElementById("reserve-name").value,
          email: document.getElementById("reserve-email").value,
          phone: document.getElementById("reserve-phone").value,
          event: eventValue,
          eventName:
            document.getElementById("reserve-interest").options[
              document.getElementById("reserve-interest").selectedIndex
            ].text,
          price: eventPrices[eventValue] || 0,
        };
  
        // Show confirmation
        showReservationConfirmation(currentReservation);
      });
  
    // Show reservation confirmation
    function showReservationConfirmation(reservation) {
      document.getElementById("unique-key-value").textContent = reservation.key;
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
    });
  
    // Setup registration form with reservation data
    function setupRegistrationForm(reservation) {
      // Auto-fill fields
      document.getElementById("unique-id").value = reservation.key;
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
  
      const duoEvents = ["coding", "quiz", "escape", "startup"];
      const squadEvents = ["bgmi", "freefire", "treasure", "ipl"];
  
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
  
    // File upload display
    document
      .getElementById("payment-screenshot")
      .addEventListener("change", function (e) {
        const fileName = e.target.files[0]?.name || "No file chosen";
        document.getElementById("file-name").textContent = fileName;
      });
  
    // Copy UPI ID
    document
      .querySelector(".copy-upi-btn")
      .addEventListener("click", function () {
        navigator.clipboard.writeText("vidyutkshetra@upi").then(() => {
          showNotification("UPI ID copied to clipboard!", "success");
        });
      });
  
    // Payment form submission
    document
      .getElementById("payment-form")
      .addEventListener("submit", function (e) {
        e.preventDefault();
  
        // Get all team members
        const teamMembers = [document.getElementById("member1").value];
        if (document.getElementById("member2"))
          teamMembers.push(document.getElementById("member2").value);
        if (document.getElementById("member3"))
          teamMembers.push(document.getElementById("member3").value);
        if (document.getElementById("member4"))
          teamMembers.push(document.getElementById("member4").value);
  
        // Prepare payment data
        const paymentData = {
          uniqueKey: currentReservation.key,
          event: currentReservation.eventName,
          teamName: document.getElementById("team-name").value,
          teamMembers: teamMembers,
          amount: currentReservation.price,
          transactionId: document.getElementById("transaction-id").value,
          paymentProof:
            document.getElementById("payment-screenshot").files[0]?.name || "",
          timestamp: new Date().toISOString(),
        };
  
        console.log("Submitting payment:", paymentData);
        // In real app: Send to backend API using fetch()
  
        showNotification("Registration completed successfully!", "success");
        document.getElementById("payment-popup").style.display = "none";
  
        // Reset forms
        document.getElementById("reservation-form").reset();
        document.getElementById("registration-form").reset();
        document.getElementById("payment-form").reset();
        document.getElementById("file-name").textContent = "No file chosen";
  
        // Show reservation form again
        document.getElementById("register").style.display = "none";
        document.getElementById("reservation-confirmation").style.display =
          "none";
        document.getElementById("reserve").style.display = "block";
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