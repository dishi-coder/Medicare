document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

document.querySelector('.btn-blue').addEventListener('click', () => {
  alert("Redirecting to Symptom Form...");
});

const doctors = document.querySelectorAll('.available-badge');

doctors.forEach(doc => {
  doc.addEventListener('click', () => {
    if (doc.classList.contains('available')) {
      doc.classList.remove('available');
      doc.classList.add('busy');
      doc.textContent = "In surgery";
    } else {
      doc.classList.remove('busy');
      doc.classList.add('available');
      doc.textContent = "Available";
    }
  });
});


const counters = document.querySelectorAll('.stat-number');

counters.forEach(counter => {
  let updateCount = () => {
    const target = +counter.innerText.replace(/[^0-9]/g, '');
    let count = 0;
    let speed = target / 100;

    const increment = () => {
      if (count < target) {
        count += speed;
        counter.innerText = Math.floor(count) + "+";
        setTimeout(increment, 20);
      } else {
        counter.innerText = target + "+";
      }
    };

    increment();
  };

  updateCount();
});

document.querySelector('.qa-item:last-child').addEventListener('click', () => {
  alert("Calling Emergency Number: 108 🚑");
});

window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (window.scrollY > 50) {
    nav.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
  } else {
    nav.style.boxShadow = "0 1px 6px rgba(0,0,0,0.06)";
  }
});

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function(e){
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const storedUser = JSON.parse(localStorage.getItem("patient"));

    if(!storedUser){
      alert("No user found! Please register first.");
      return;
    }

    if(email === storedUser.email && password === storedUser.password){
      alert("Login Successful ✅");
      window.location.href = "index.html";
    } else {
      alert("Invalid credentials ❌");
    }
  });
}
// quick action dashboard but
const dashboardQA = document.getElementById("dashboardQA");

if (dashboardQA) {
  dashboardQA.addEventListener("click", (e) => {
    e.preventDefault();

    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn === "true") {
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "patient-login.html";
    }
  });
}
const dashboardHero = document.getElementById("dashboardHero");

if (dashboardHero) {
  dashboardHero.addEventListener("click", function(e) {
    e.preventDefault();

    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn === "true") {
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "patient-login.html";
    }
  });
}