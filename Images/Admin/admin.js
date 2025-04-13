// Import Firebase modules from the correct locations
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
// Import auth functions from firebase-auth.js, not firebase-app.js
import { 
  getAuth, 
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut 
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { 
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD-M5JKGaaEKBOHgx_o-BzTHvPpqAyvLyc",
    authDomain: "vidyutkshetra.firebaseapp.com",
    databaseURL: "https://vidyutkshetra-default-rtdb.firebaseio.com",
    projectId: "vidyutkshetra",
    storageBucket: "vidyutkshetra.firebasestorage.app",
    messagingSenderId: "678792001265",
    appId: "1:678792001265:web:10c8f7b15dc6df1b8d9b50",
    measurementId: "G-XPD5TJ4ELZ"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let currentRegistration = null;
const modal = document.getElementById("registration-modal");

// Authentication Functions
async function loginAdmin(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Admin logged in successfully:", userCredential.user);
    showNotification("Login successful", "success");
    return userCredential.user;
  } catch (error) {
    console.error("Login failed:", error.message);
    showNotification("Login failed: " + error.message, "error");
    throw error;
  }
}

function setupAuthStateListener() {
  onAuthStateChanged(auth, (user) => {
    const adminContent = document.querySelector('.admin-container');
    const loginForm = document.getElementById('admin-login-form');
    
    if (user) {
      // User is signed in
      if (adminContent) adminContent.style.display = 'flex';
      if (loginForm) loginForm.style.display = 'none';
      
      // Update UI with admin info
      const userInfoSpan = document.querySelector('.user-info span');
      if (userInfoSpan) userInfoSpan.textContent = user.email || 'Admin User';
      
      // Load registration data
      loadRegistrationsFromFirebase();
    } else {
      // User is signed out
      if (adminContent) adminContent.style.display = 'none';
      if (loginForm) loginForm.style.display = 'flex';
    }
  });
}

function logoutAdmin() {
  signOut(auth).then(() => {
    showNotification("Logged out successfully", "info");
  }).catch((error) => {
    console.error("Logout failed:", error);
    showNotification("Logout failed", "error");
  });
}

// Database Functions
async function loadRegistrationsFromFirebase() {
  try {
    const registrationsRef = collection(db, "registrations");
    const querySnapshot = await getDocs(registrationsRef);
    
    const registrations = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      registrations.push({
        id: doc.id,
        uniqueID: data.uniqueID || `VK-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        college: data.clg_name, // Change from College to college and use data.clg_name
        event: data.event,
        eventName: getEventFullName(data.event),
        team: data.team,
        members: data.members || [data.name],
        amount: data.amount,
        status: data.status || "reserved",
        txnId: data.txnId,
        paymentScreenshot: data.paymentScreenshot,
        timestamp: data.timestamp ? new Date(data.timestamp.seconds * 1000) : new Date()
      });
    });
    
    // Update UI with the data
    updateDashboardStats(registrations);
    renderRegistrationsTable(registrations);
    
    showNotification(`Loaded ${registrations.length} registrations`, "success");
  } catch (error) {
    console.error("Error loading registrations:", error);
    showNotification("Failed to load registrations", "error");
  }
}

function getEventFullName(eventCode) {
  const eventMap = {
    "Coding": "Coding and Debugging",
    "IT_Quiz": "IT Quiz",
    "Bgmi": "BGMI",
    "Free_Fire": "Free Fire",
    "Treasure": "Treasure Hunt",
    "Ipl": "IPL Auction",
    "Escape": "Escape Room",
    "Startup": "Start-up Pitch"
  };
  
  return eventMap[eventCode] || eventCode;
}

async function applyFilters() {
  const eventFilter = document.getElementById("event-filter")?.value;
  const statusFilter = document.getElementById("status-filter")?.value;
  const searchTerm = document.getElementById("search")?.value.toLowerCase() || "";

  try {
    // Start building query
    let registrationsRef = collection(db, "registrations");
    let constraints = [];
    
    if (eventFilter) {
      constraints.push(where("event", "==", eventFilter));
    }
    
    if (statusFilter) {
      constraints.push(where("status", "==", statusFilter));
    }
    
    // Create the query with constraints
    let registrationsQuery;
    if (constraints.length > 0) {
      registrationsQuery = query(registrationsRef, ...constraints, orderBy("timestamp", "desc"));
    } else {
      registrationsQuery = query(registrationsRef, orderBy("timestamp", "desc"));
    }
    
    const querySnapshot = await getDocs(registrationsQuery);
    
    let filteredRegistrations = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Apply client-side search if search term exists
      if (searchTerm) {
        if (
          !data.name?.toLowerCase().includes(searchTerm) &&
          !data.email?.toLowerCase().includes(searchTerm) &&
          !(data.uniqueID && data.uniqueID.toLowerCase().includes(searchTerm)) &&
          !(data.team && data.team.toLowerCase().includes(searchTerm))
        ) {
          return; // Skip this record if it doesn't match search
        }
      }
      
      filteredRegistrations.push({
        id: doc.id,
        uniqueID: data.uniqueID || `VK-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        college:data.clg_name,
        event: data.event,
        eventName: getEventFullName(data.event),
        team: data.team,
        members: data.members || [data.name],
        amount: data.amount,
        status: data.status || "reserved",
        txnId: data.txnId,
        paymentScreenshot: data.paymentScreenshot,
        timestamp: data.timestamp ? new Date(data.timestamp.seconds * 1000) : new Date()
      });
    });
    
    renderRegistrationsTable(filteredRegistrations);
    showNotification(`Showing ${filteredRegistrations.length} filtered registrations`, "success");
  } catch (error) {
    console.error("Error applying filters:", error);
    showNotification("Failed to apply filters", "error");
  }
}

async function updateRegistrationStatus(registrationId, newStatus) {
  try {
    const registrationRef = doc(db, "registrations", registrationId);
    await updateDoc(registrationRef, {
      status: newStatus,
      lastUpdated: new Date()
    });
    
    showNotification(`Registration status updated to ${newStatus}`, "success");
    
    // Reload the data to reflect changes
    loadRegistrationsFromFirebase();
  } catch (error) {
    console.error("Error updating registration:", error);
    showNotification("Failed to update registration", "error");
  }
}

// UI Functions
function updateDashboardStats(registrations) {
  const totalRegistrations = registrations.length;
  const confirmedPayments = registrations.filter(reg => reg.status === "paid").length;
  const pendingPayments = registrations.filter(reg => reg.status === "pending").length;
  
  // Calculate total revenue
  const totalRevenue = registrations
    .filter(reg => reg.status === "paid")
    .reduce((sum, reg) => sum + (reg.amount || 0), 0);
  
  // Update the stats on the dashboard
  document.getElementById("total-registrations").textContent = totalRegistrations;
  document.getElementById("confirmed-payments").textContent = confirmedPayments;
  document.getElementById("pending-payments").textContent = pendingPayments;
  document.getElementById("total-revenue").textContent = `₹${totalRevenue}`;
}

function renderRegistrationsTable(registrations) {
  const tableBody = document.querySelector("#registrations-table tbody");
  if (!tableBody) return;
  
  tableBody.innerHTML = "";
  
  if (registrations.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 20px;">No registrations found</td>
      </tr>
    `;
    return;
  }
  
  registrations.forEach(reg => {
    const row = document.createElement("tr");
    
    // Get status class for badge
    const statusClass = `status-${reg.status}`;
    
    row.innerHTML = `
      <td>${reg.uniqueID}</td>
      <td>${reg.name}</td>
      <td>${reg.college || "Not provided"}</td>
      <td>${reg.eventName}</td>
      <td>${reg.team || "Individual"}</td>
      <td>₹${reg.amount || 0}</td>
      <td><span class="status-badge ${statusClass}">${reg.status}</span></td>
      <td>
        <button class="btn primary action-btn view-btn" data-id="${reg.id}">View</button>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Add event listeners to view buttons
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const regId = btn.getAttribute("data-id");
      const registration = registrations.find(r => r.id === regId);
      if (registration) {
        showRegistrationDetails(registration);
      }
    });
  });
}

function showRegistrationDetails(registration) {
  if (!modal) return;
  
  // Store current registration for modal actions
  currentRegistration = registration;
  
  // Format date
  const formattedDate = registration.timestamp.toLocaleString();
  
  // Build members list if it exists
  let membersList = "";
  if (registration.members && registration.members.length > 0) {
    membersList = `
      <div class="detail-group">
        <label>Team Members</label>
        <p>${registration.members.join(", ")}</p>
      </div>
    `;
  }
  
  // Create payment screenshot if it exists
  let screenshotDiv = "";
  if (registration.paymentScreenshot) {
    screenshotDiv = `
      <div class="screenshot-container">
        <label>Payment Screenshot</label>
        <img src="${registration.paymentScreenshot}" alt="Payment Screenshot">
      </div>
    `;
  }
  
  // Populate modal with registration details
  const detailsDiv = document.getElementById("registration-details");
  detailsDiv.innerHTML = `
    <div class="detail-group">
      <label>Registration ID</label>
      <p>${registration.uniqueID}</p>
    </div>
    <div class="detail-group">
      <label>Name</label>
      <p>${registration.name}</p>
    </div>
    <div class="detail-group">
      <label>Email</label>
      <p>${registration.email}</p>
    </div>
    <div class="detail-group">
      <label>Phone</label>
      <p>${registration.phone || "Not provided"}</p>
    </div>
    <div class="detail-group">
      <label>College</label>
      <p>${registration.college || "Not provided"}</p>
    </div>
    <div class="detail-group">
      <label>Event</label>
      <p>${registration.eventName}</p>
    </div>
    <div class="detail-group">
      <label>Team Name</label>
      <p>${registration.team || "Individual"}</p>
    </div>
    ${membersList}
    <div class="detail-group">
      <label>Amount</label>
      <p>₹${registration.amount || 0}</p>
    </div>
    <div class="detail-group">
      <label>Status</label>
      <p>${registration.status}</p>
    </div>
    <div class="detail-group">
      <label>Transaction ID</label>
      <p>${registration.txnId || "Not provided"}</p>
    </div>
    <div class="detail-group">
      <label>Registration Date</label>
      <p>${formattedDate}</p>
    </div>
    ${screenshotDiv}
  `;
  
  // Show modal
  modal.style.display = "block";
  document.body.style.overflow = "hidden";
  
  // Configure buttons based on status
  const approveBtn = document.getElementById("approve-btn");
  const rejectBtn = document.getElementById("reject-btn");
  const reminderBtn = document.getElementById("reminder-btn");
  
  if (registration.status === "paid") {
    approveBtn.style.display = "none";
    rejectBtn.textContent = "Mark as Unpaid";
  } else {
    approveBtn.style.display = "inline-block";
    rejectBtn.textContent = "Reject Payment";
  }
  
  if (registration.status === "reserved") {
    reminderBtn.style.display = "inline-block";
  } else {
    reminderBtn.style.display = "none";
  }
}

// Action functions
async function approvePayment() {
  if (!currentRegistration) return;

  try {
    await updateRegistrationStatus(currentRegistration.id, "paid");
    
    // Close modal
    if (modal) modal.style.display = "none";
    document.body.style.overflow = "auto";
  } catch (error) {
    console.error("Error approving payment:", error);
    showNotification("Failed to approve payment", "error");
  }
}

async function rejectPayment() {
    if (!currentRegistration) return;
  
    const newStatus = currentRegistration.status === "paid" ? "pending" : "reserved";
    const actionText = currentRegistration.status === "paid" ? "mark as unpaid" : "reject payment for";
  
    if (confirm(`Are you sure you want to ${actionText} ${currentRegistration.uniqueID}?`)) {
      try {
        await updateRegistrationStatus(currentRegistration.id, newStatus);
        
        // Close modal
        if (modal) modal.style.display = "none";
        document.body.style.overflow = "auto";
      } catch (error) {
        console.error("Error rejecting payment:", error);
        showNotification("Failed to update status", "error");
      }
    }
  }
  
  async function sendReminder(registrationId) {
    try {
      // Get the registration details
      const registrationRef = doc(db, "registrations", registrationId);
      const registrationDoc = await getDoc(registrationRef);
      
      if (registrationDoc.exists()) {
        const regData = registrationDoc.data();
        
        // Here you would typically integrate with a notification service
        // For now, we'll just log and show a notification
        console.log(`Sending reminder to ${regData.email} for registration ${regData.uniqueID}`);
        
        // Update the last reminder timestamp
        await updateDoc(registrationRef, {
          lastReminderSent: new Date()
        });
        
        showNotification(`Reminder sent to ${regData.name} (${regData.uniqueID})`, "success");
        
        // Close modal
        if (modal) modal.style.display = "none";
        document.body.style.overflow = "auto";
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      showNotification("Failed to send reminder", "error");
    }
  }
  
  // Helper function for notifications
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
  
  // Setup event listeners
  function setupEventListeners() {
    // Filter button
    const applyFiltersBtn = document.getElementById("apply-filters");
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener("click", applyFilters);
    }
    
    // Modal close button
    const closeBtn = document.querySelector(".close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
      });
    }
    
    // Close modal when clicking outside
    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
      }
    });
    
    // Modal action buttons
    const approveBtn = document.getElementById("approve-btn");
    if (approveBtn) {
      approveBtn.addEventListener("click", approvePayment);
    }
    
    const rejectBtn = document.getElementById("reject-btn");
    if (rejectBtn) {
      rejectBtn.addEventListener("click", rejectPayment);
    }
    
    const reminderBtn = document.getElementById("reminder-btn");
    if (reminderBtn) {
      reminderBtn.addEventListener("click", () => {
        if (currentRegistration) {
          sendReminder(currentRegistration.id);
        }
      });
    }
  }
  
  // Initialize application
  document.addEventListener("DOMContentLoaded", function() {
    // Setup auth state listener
    setupAuthStateListener();
    
    // Setup event listeners
    setupEventListeners();
    
    // Add login form listener
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        
        try {
          await loginAdmin(email, password);
        } catch (error) {
          // Error is already handled in loginAdmin function
        }
      });
    }
    
    // Add logout button listener
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logoutAdmin);
    }
  });