// =====================================================
// STEP 1: Get every HTML element and store it in a variable
// =====================================================

// Pages
var homePage = document.getElementById("homePage");
var customerPage = document.getElementById("customerPage");
var loginPage = document.getElementById("loginPage");
var agentPage = document.getElementById("agentPage");

// Home page boxes
var customerBox = document.getElementById("customerBox");
var agentBox = document.getElementById("agentBox");

// Back / logout buttons
var customerBackBtn = document.getElementById("customerBackBtn");
var loginBackBtn = document.getElementById("loginBackBtn");
var logoutBtn = document.getElementById("logoutBtn");

// Ticket form (customer)
var ticketForm = document.getElementById("ticketForm");
var nameInput = document.getElementById("name");
var emailInput = document.getElementById("email");
var categoryInput = document.getElementById("category");
var priorityInput = document.getElementById("priority");
var subjectInput = document.getElementById("subject");
var descriptionInput = document.getElementById("description");
var formError = document.getElementById("formError");
var successMsg = document.getElementById("successMsg");

// Check my tickets (customer)
var trackEmailInput = document.getElementById("trackEmail");
var trackFilterInput = document.getElementById("trackFilter");
var trackBtn = document.getElementById("trackBtn");
var trackCount = document.getElementById("trackCount");
var customerTickets = document.getElementById("customerTickets");

// Agent login
var usernameInput = document.getElementById("username");
var passwordInput = document.getElementById("password");
var loginBtn = document.getElementById("loginBtn");
var loginError = document.getElementById("loginError");

// Agent dashboard
var statTotal = document.getElementById("statTotal");
var statOpen = document.getElementById("statOpen");
var statClosed = document.getElementById("statClosed");
var openTickets = document.getElementById("openTickets");
var closedTickets = document.getElementById("closedTickets");

// =====================================================
// STEP 2: Data (all tickets are saved in localStorage)
// =====================================================
var tickets = [];

// Agent login details (fixed, kept simple)
var AGENT_USERNAME = "agent";
var AGENT_PASSWORD = "1234";

function loadTickets() {
  var savedData = localStorage.getItem("tickets");
  if (savedData) {
    tickets = JSON.parse(savedData);
  }
}

function saveTickets() {
  localStorage.setItem("tickets", JSON.stringify(tickets));
}

// Stops user text from being treated as HTML
function safeText(text) {
  text = text.split("<").join("&lt;");
  text = text.split(">").join("&gt;");
  return text;
}

// =====================================================
// STEP 3: Page switching
// =====================================================
function showPage(pageName) {
  homePage.classList.add("hidden");
  customerPage.classList.add("hidden");
  loginPage.classList.add("hidden");
  agentPage.classList.add("hidden");

  if (pageName === "home") {
    homePage.classList.remove("hidden");
  } else if (pageName === "customer") {
    customerPage.classList.remove("hidden");
  } else if (pageName === "login") {
    loginPage.classList.remove("hidden");
  } else if (pageName === "agent") {
    agentPage.classList.remove("hidden");
    showAgentTickets();
  }
}

// Home page: which box was clicked
customerBox.addEventListener("click", function () {
  showPage("customer");
});

agentBox.addEventListener("click", function () {
  // If agent is already logged in, go directly to the agent page
  var loggedIn = sessionStorage.getItem("agentLoggedIn");
  if (loggedIn === "yes") {
    showPage("agent");
  } else {
    showPage("login");
  }
});

customerBackBtn.addEventListener("click", function () {
  showPage("home");
});

loginBackBtn.addEventListener("click", function () {
  showPage("home");
});

logoutBtn.addEventListener("click", function () {
  sessionStorage.removeItem("agentLoggedIn");
  showPage("home");
});

// =====================================================
// STEP 4: Customer - raise a ticket
// =====================================================
ticketForm.addEventListener("submit", function (event) {
  event.preventDefault();

  // Take values from the form and store them in variables
  var name = nameInput.value.trim();
  var email = emailInput.value.trim();
  var category = categoryInput.value;
  var priority = priorityInput.value;
  var subject = subjectInput.value.trim();
  var description = descriptionInput.value.trim();

  formError.textContent = "";
  successMsg.textContent = "";

  // Form validation (without regex)
  if (name === "") {
    formError.textContent = "Please enter your name.";
    return;
  }
  if (email.indexOf("@") === -1 || email.indexOf(".") === -1) {
    formError.textContent = "Please enter a valid email (must contain @ and .).";
    return;
  }
  if (category === "") {
    formError.textContent = "Please select a category.";
    return;
  }
  if (subject === "") {
    formError.textContent = "Please enter a subject.";
    return;
  }
  if (description.length < 10) {
    formError.textContent = "Description must be at least 10 characters.";
    return;
  }

  // Create the ticket object
  var ticket = {
    id: "TKT" + (1000 + tickets.length + 1),
    name: name,
    email: email.toLowerCase(),
    category: category,
    priority: priority,
    subject: subject,
    description: description,
    status: "Open",
    date: new Date().toLocaleString(),
    reply: ""
  };

  tickets.push(ticket);
  saveTickets();

  successMsg.textContent = "Ticket submitted! Your Ticket ID is " + ticket.id;
  ticketForm.reset();
});

// =====================================================
// STEP 5: Build the HTML of one ticket
// =====================================================
function ticketHTML(ticket, isAgent) {
  var html = "";

  html += '<div class="ticket ' + ticket.status + '">';
  html += "<h3>" + ticket.id + " - " + safeText(ticket.subject) + "</h3>";
  html += '<span class="badge ' + ticket.status + '">' + ticket.status + "</span> ";
  html += "<small>Category: " + ticket.category + "</small><br>";
  html += "<small>By " + safeText(ticket.name) + " (" + safeText(ticket.email) + ") on " + ticket.date + "</small>";
  html += "<p>" + safeText(ticket.description) + "</p>";

  // Show agent reply if it is there
  if (ticket.reply !== "") {
    html += '<div class="reply"><b>Agent Reply:</b> ' + safeText(ticket.reply) + "</div>";
  }

  // Reply box only for the agent and only for open tickets
  if (isAgent && ticket.status === "Open") {
    html += "<label>Your Reply</label>";
    html += '<textarea id="reply-' + ticket.id + '" rows="2" placeholder="Write a reply"></textarea>';
    html += '<p class="error" id="replyError-' + ticket.id + '"></p>';
    html += '<button class="primary" onclick="replyAndClose(\'' + ticket.id + '\')">Send Reply and Close Ticket</button>';
  }

  html += "</div>";
  return html;
}

// =====================================================
// STEP 6: Customer - check my tickets (Open / Closed)
// =====================================================
trackBtn.addEventListener("click", function () {
  var email = trackEmailInput.value.trim().toLowerCase();
  var filter = trackFilterInput.value;
  var html = "";
  var openCount = 0;
  var closedCount = 0;

  if (email === "") {
    trackCount.textContent = "";
    customerTickets.innerHTML = "<p class='error'>Please enter your email.</p>";
    return;
  }

  for (var i = 0; i < tickets.length; i++) {
    var t = tickets[i];

    if (t.email === email) {
      // Count open and closed tickets of this customer
      if (t.status === "Open") {
        openCount++;
      } else {
        closedCount++;
      }

      // Show the ticket only if it matches the filter
      if (filter === "All" || t.status === filter) {
        html += ticketHTML(t, false);
      }
    }
  }

  if (openCount + closedCount === 0) {
    trackCount.textContent = "";
    html = "<p>No tickets found for this email.</p>";
  } else {
    trackCount.textContent = "Open: " + openCount + " | Closed: " + closedCount;
    if (html === "") {
      html = "<p>No " + filter + " tickets.</p>";
    }
  }

  customerTickets.innerHTML = html;
});

// =====================================================
// STEP 7: Agent login
// =====================================================
loginBtn.addEventListener("click", function () {
  var username = usernameInput.value.trim();
  var password = passwordInput.value;

  if (username === AGENT_USERNAME && password === AGENT_PASSWORD) {
    sessionStorage.setItem("agentLoggedIn", "yes");
    loginError.textContent = "";
    usernameInput.value = "";
    passwordInput.value = "";
    showPage("agent");
  } else {
    loginError.textContent = "Wrong username or password.";
  }
});

// =====================================================
// STEP 8: Agent - show tickets, reply and close
// =====================================================
function showAgentTickets() {
  var openHTML = "";
  var closedHTML = "";
  var openCount = 0;
  var closedCount = 0;

  for (var i = 0; i < tickets.length; i++) {
    if (tickets[i].status === "Open") {
      openHTML += ticketHTML(tickets[i], true);
      openCount++;
    } else {
      closedHTML += ticketHTML(tickets[i], true);
      closedCount++;
    }
  }

  if (openHTML === "") {
    openHTML = "<p>No open tickets.</p>";
  }
  if (closedHTML === "") {
    closedHTML = "<p>No closed tickets.</p>";
  }

  openTickets.innerHTML = openHTML;
  closedTickets.innerHTML = closedHTML;

  statTotal.textContent = tickets.length;
  statOpen.textContent = openCount;
  statClosed.textContent = closedCount;
}

// Called when the agent clicks "Send Reply and Close Ticket"
function replyAndClose(id) {
  var replyBox = document.getElementById("reply-" + id);
  var replyError = document.getElementById("replyError-" + id);
  var replyText = replyBox.value.trim();

  if (replyText === "") {
    replyError.textContent = "Please write a reply before closing the ticket.";
    return;
  }

  for (var i = 0; i < tickets.length; i++) {
    if (tickets[i].id === id) {
      tickets[i].reply = replyText;
      tickets[i].status = "Closed";
    }
  }

  saveTickets();
  showAgentTickets();
}

// =====================================================
// START
// =====================================================
loadTickets();
