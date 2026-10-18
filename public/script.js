document.addEventListener("DOMContentLoaded", function () {
  // ===========================
  // Modal Management
  // ===========================
  const modalBackdrop = document.getElementById("modalBackdrop");
  const modalBody = document.getElementById("modalBody");
  const modalTitle = document.getElementById("modalTitle");
  const modalClose = document.getElementById("modalClose");

  // Modal content templates
  const modals = {
    dashboard: {
      title: "📊 Dashboard Overview",
      content: `
        <div style="text-align: center; padding: 20px;">
          <p style="font-size: 1.1rem; color: var(--text); line-height: 1.8;">
            Welcome to your personalized academic dashboard! Track your GPA, monitor course progress, manage assignments, and stay on top of your study schedule. Your AI tutor is ready to help you succeed! 🚀
          </p>
        </div>
      `
    },
    courses: {
      title: "📚 My Courses",
      content: `
        <div class="courses-container">
          <div class="course-card">
            <div class="course-header blue">CS</div>
            <h3>Calculus 2</h3>
            <div class="course-prof">Dr. Rommel T. Dasalla</div>
            <div class="progress">
              <div class="progress-bar" style="width: 82%;"></div>
            </div>
            <div class="progress-text">82% Complete</div>
            <div class="course-credit">3 Credits • 16 weeks</div>
          </div>
          <div class="course-card">
            <div class="course-header purple">AI</div>
            <h3>ENGADS01</h3>
            <div class="course-prof">Sir Jerry Sermeno</div>
            <div class="progress">
              <div class="progress-bar" style="width: 74%;"></div>
            </div>
            <div class="progress-text">74% Complete</div>
            <div class="course-credit">4 Credits • 16 weeks</div>
          </div>
          <div class="course-card">
            <div class="course-header green">DB</div>
            <h3>COEPRO01</h3>
            <div class="course-prof">Sir Conrad Hidalgo</div>
            <div class="progress">
              <div class="progress-bar" style="width: 91%;"></div>
            </div>
            <div class="progress-text">91% Complete</div>
            <div class="course-credit">3 Credits • 16 weeks</div>
          </div>
        </div>
      `
    },
    schedule: {
      title: "📅 Weekly Schedule",
      content: `
        <div class="schedule-container">
          <div class="schedule-day">
            <h3 class="day-name">Monday</h3>
            <div class="class-item">
              <div style="flex: 1;">
                <div class="class-name">Data Structures</div>
                <div class="class-location">🚩 Room 101</div>
              </div>
              <div class="class-time">09:00 - 10:30 AM</div>
            </div>
            <div class="class-item">
              <div style="flex: 1;">
                <div class="class-name">Database Systems</div>
                <div class="class-location">🚩 Room 205</div>
              </div>
              <div class="class-time">11:00 AM - 12:30 PM</div>
            </div>
          </div>
          <div class="schedule-day">
            <h3 class="day-name">Tuesday</h3>
            <div class="class-item">
              <div style="flex: 1;">
                <div class="class-name">AI & Machine Learning</div>
                <div class="class-location">🚩 Room 301</div>
              </div>
              <div class="class-time">10:00 - 11:30 AM</div>
            </div>
            <div class="class-item">
              <div style="flex: 1;">
                <div class="class-name">Programming Lab</div>
                <div class="class-location">🚩 Room 401</div>
              </div>
              <div class="class-time">02:00 - 03:30 PM</div>
            </div>
          </div>
          <div class="schedule-day">
            <h3 class="day-name">Wednesday</h3>
            <div class="class-item">
              <div style="flex: 1;">
                <div class="class-name">Web Development</div>
                <div class="class-location">🚩 Room 501</div>
              </div>
              <div class="class-time">09:30 - 11:00 AM</div>
            </div>
          </div>
        </div>
      `
    },
    assessments: {
      title: "✅ Assessments & Deadlines",
      content: `
        <div class="assessments-container">
          <div class="assessment-card urgent">
            <div class="assessment-header">
              <div>
                <h3>AI Project Proposal</h3>
              </div>
              <span class="urgency-badge">URGENT</span>
            </div>
            <div class="assessment-details">
              <div><strong>Course:</strong> Artificial Intelligence</div>
              <div><strong>Deadline:</strong> Today, 5:00 PM</div>
              <div><strong>Status:</strong> Not Started</div>
              <div><strong>Weight:</strong> 20%</div>
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line);">
                <strong>0% Complete</strong>
              </div>
            </div>
          </div>

          <div class="assessment-card important">
            <div class="assessment-header">
              <div>
                <h3>Algorithms Quiz</h3>
              </div>
              <span class="urgency-badge">THIS WEEK</span>
            </div>
            <div class="assessment-details">
              <div><strong>Course:</strong> Data Structures</div>
              <div><strong>Deadline:</strong> Tomorrow, 10:00 AM</div>
              <div><strong>Duration:</strong> 60 minutes</div>
              <div><strong>Questions:</strong> 25 (Multiple Choice + Short Answer)</div>
              <div><strong>Topics:</strong> Sorting, Searching, Graph Algorithms</div>
              <button class="action-btn" style="margin-top: 14px; width: 100%;">Take Quiz Now</button>
            </div>
          </div>

          <div class="assessment-card">
            <div class="assessment-header">
              <div>
                <h3>DB Lab Submission</h3>
              </div>
              <span class="urgency-badge">NEXT WEEK</span>
            </div>
            <div class="assessment-details">
              <div><strong>Course:</strong> Database Systems</div>
              <div><strong>Deadline:</strong> Friday, 11:59 PM</div>
              <div><strong>Type:</strong> Lab Assignment</div>
              <div><strong>Status:</strong> In Progress (60% Complete)</div>
            </div>
          </div>
        </div>
      `
    },
    analytics: {
      title: "📈 Academic Analytics",
      content: `
        <div class="dashboard-stats">
  <div class="stat-box">
    <div class="stat-label">Current GPA</div>
    <div class="stat-value" id="statGpa">...</div>
    <div class="stat-trend up" id="statGpaTrend"></div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Overall Progress</div>
    <div class="stat-value" id="statProgress">...</div>
    <div class="stat-trend up" id="statProgressTrend"></div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Study Time (Week)</div>
    <div class="stat-value" id="statStudy">...</div>
    <div class="stat-trend up" id="statStudyTrend"></div>
  </div>
  <div class="stat-box">
    <div class="stat-label">Average Score</div>
    <div class="stat-value" id="statAvg">...</div>
    <div class="stat-trend up" id="statAvgTrend"></div>
  </div>
</div>

        <div style="margin-top: 20px;">
          <h3 style="margin-bottom: 14px; font-size: 1.1rem; color: var(--primary);">📊 Course Performance</h3>
          <div class="performance-grid">
            <div class="performance-card">
              <h4>Database Systems</h4>
              <div class="grade excellent">A (91%)</div>
              <div class="status">Excellent Performance</div>
            </div>
            <div class="performance-card">
              <h4>Data Structures</h4>
              <div class="grade good">B+ (82%)</div>
              <div class="status">Good Progress</div>
            </div>
            <div class="performance-card">
              <h4>Artificial Intelligence</h4>
              <div class="grade average">B (74%)</div>
              <div class="status">Needs Improvement</div>
            </div>
          </div>
        </div>
      `
    },
    tutor: {
      title: "🤖 AI Tutor",
      content: `
        <div style="text-align: center; padding: 20px;">
          <p style="font-size: 1.1rem; color: var(--text); margin-bottom: 20px;">
            Welcome to your AI Tutor! I'm here to help you with:
          </p>
          <div style="text-align: left; max-width: 400px; margin: 0 auto;">
            <div style="background: var(--panel-soft); padding: 12px; border-radius: 8px; margin-bottom: 12px;">✅ Coursework and assignments</div>
            <div style="background: var(--panel-soft); padding: 12px; border-radius: 8px; margin-bottom: 12px;">📚 Study plans and tips</div>
            <div style="background: var(--panel-soft); padding: 12px; border-radius: 8px; margin-bottom: 12px;">🎯 Quiz preparation</div>
            <div style="background: var(--panel-soft); padding: 12px; border-radius: 8px; margin-bottom: 12px;">💡 Concept explanations</div>
            <div style="background: var(--panel-soft); padding: 12px; border-radius: 8px;">❓ Any academic questions</div>
          </div>
          <p style="font-size: 0.95rem; color: var(--muted); margin-top: 20px;">
            Use the chat in the dashboard to start asking questions!
          </p>
        </div>
      `
    }
  };

  // Open modal function
  window.openModal = function(modalType) {
    const modal = modals[modalType];
    if (!modal) return;

    modalTitle.textContent = modal.title;
    modalBody.innerHTML = modal.content;
    modalBackdrop.classList.add("active");
  };

  // Close modal function
  function closeModal() {
    modalBackdrop.classList.remove("active");
    if (modalType === "analytics") loadAnalyticsStats();
  }
async function loadAnalyticsStats() {
  try {
    const res = await fetch("/api/student/stats");
    const s = await res.json();
    document.getElementById("statGpa").textContent = s.gpa.toFixed(2);
    document.getElementById("statGpaTrend").textContent = `↑ +${s.gpaChange}`;
    document.getElementById("statProgress").textContent = `${s.progress}%`;
    document.getElementById("statProgressTrend").textContent = `↑ +${s.progressChange}%`;
    document.getElementById("statStudy").textContent = `${s.studyHours}h`;
    document.getElementById("statStudyTrend").textContent = `↑ +${s.studyChange}h`;
    document.getElementById("statAvg").textContent = `${s.avgScore}%`;
    document.getElementById("statAvgTrend").textContent = `↑ +${s.avgChange}%`;
  } catch (err) {
    console.error("Failed to load stats:", err);
  }
}

  modalClose.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", function(e) {
    if (e.target === modalBackdrop) closeModal();
  });

  // ===========================
  // Navigation
  // ===========================
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", function() {
      const modalType = this.dataset.modal;
      openModal(modalType);
      
      navItems.forEach(nav => nav.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // ===========================
  // Chatbot functionality
  // ===========================
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatWindow = document.getElementById("chatWindow");
  const quickChips = document.querySelectorAll(".chip");

  // Add initial bot message
  addMessage("Hello! I'm your AI Tutor. How can I help you today? 👋", "bot");

  function addMessage(text, sender = "bot") {
    if (!chatWindow) return;

    const message = document.createElement("div");
    message.className = `message ${sender}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar small";
    avatar.textContent = sender === "bot" ? "AI" : "ME";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    if (sender === "bot") {
      message.appendChild(avatar);
      message.appendChild(bubble);
    } else {
      message.appendChild(bubble);
    }

    chatWindow.appendChild(message);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function generateTutorResponse(input) {
    const text = input.toLowerCase();

    if (text.includes("deadline") || text.includes("due") || text.includes("assignment")) {
      return "You have 3 upcoming deadlines this week: Database Systems (today at 5:00 PM), Algorithms Quiz (tomorrow), and DB Lab Submission (Friday). Click 'Assessments' in the sidebar to see details.";
    }
    if (text.includes("schedule") || text.includes("class") || text.includes("timetable")) {
      return "Your schedule shows classes on Monday, Tuesday, and Wednesday. Data Structures and Database Systems are on Monday. Click 'Schedule' to view your full weekly timetable.";
    }
    if (text.includes("gpa") || text.includes("grade") || text.includes("score")) {
      return "Your current GPA is 3.88, which is excellent! Database Systems: A (91%), Data Structures: B+ (82%), AI: B (74%). Check your Analytics for more details.";
    }
    if (text.includes("study") || text.includes("help") || text.includes("learn")) {
      return "I can help you with coursework, study tips, quiz preparation, and more! For quizzes, I recommend reviewing lecture notes and solving 5-10 practice questions. What subject would you like help with?";
    }
    if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
      return "Hello! I'm your AI Tutor. I can help with coursework, deadlines, study plans, and anything academic. Ask me anything! 📚";
    }
    if (text.includes("calculus") || text.includes("algebra") || text.includes("math")) {
      return "Math can be challenging! What specific topic are you struggling with? Integration, derivatives, or something else? I can help break it down for you.";
    }
    if (text.includes("database") || text.includes("sql")) {
      return "Database Systems is one of your strongest courses at 91%! Keep up the great work. Need help with SQL queries or relational models?";
    }
    return "That's a great question! I'm here to help. Can you provide more details? I can assist with coursework, exams, study strategies, or time management. 💡";
  }

  // Chat event listeners
  if (chatForm) {
    chatForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;

      addMessage(message, "user");
      chatInput.value = "";

      setTimeout(() => {
        const response = generateTutorResponse(message);
        addMessage(response, "bot");
      }, 500);
    });
  }

  // Quick action chips
  quickChips.forEach(chip => {
    chip.addEventListener("click", function() {
      const text = this.textContent;
      addMessage(text, "user");
      setTimeout(() => {
        const response = generateTutorResponse(text);
        addMessage(response, "bot");
      }, 500);
    });
  });

  // ===========================
  // Course and task interactions
  // ===========================
  const courseItems = document.querySelectorAll(".course-item");
  courseItems.forEach(item => {
    item.addEventListener("click", function() {
      const courseName = this.querySelector(".course-info h3").textContent;
      addMessage(`Tell me more about ${courseName}`, "user");
      setTimeout(() => {
        addMessage(`${courseName} is progressing well! Your progress bar shows you're on track. Keep up the good work! 📚`, "bot");
      }, 500);
    });
  });

  const taskItems = document.querySelectorAll(".task-list li");
  taskItems.forEach(item => {
    item.addEventListener("click", function() {
      const taskName = this.querySelector("strong").textContent;
      addMessage(`How much time do I have for ${taskName}?`, "user");
      setTimeout(() => {
        addMessage(`This task is due soon. I recommend starting it today to avoid last-minute stress. Would you like study tips?`, "bot");
      }, 500);
    });
  });

  // ===========================
  // Stat card interactions
  // ===========================
  const statCards = document.querySelectorAll(".stat-card");
  statCards.forEach(card => {
    card.addEventListener("click", function() {
      const statName = this.querySelector("p").textContent;
      addMessage(`What does my ${statName} mean?`, "user");
      setTimeout(() => {
        addMessage(`Great question! Click 'Analytics' in the sidebar for a detailed breakdown of your academic performance. 📊`, "bot");
      }, 500);
    });
  });

  console.log("✅ Dashboard initialized successfully!");

  async function addItem(name) {
  const res = await fetch("/api/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

async function loadItems() {
  const res = await fetch("/api/items");
  const data = await res.json();
  console.log(data);
}

addItem("Test item").then(loadItems);
});