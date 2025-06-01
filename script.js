js
KopyalaDüzenle
// Sorular (literatür ve dijital bağımlılık ölçümünden seçilmiş)
const questions = [
  "Günde 3 saatten fazla dijital cihaz kullanıyorum.",
  "Sosyal medya hesaplarımı sık sık kontrol ederim.",
  "Cihazlarım yanımda olmadığında huzursuz olurum.",
  "Yüz yüze iletişim yerine çevrim içi iletişimi tercih ederim.",
  "Dijital cihazlarımı amaçsızca kullanırım.",
  "Dijital ortamda geçirilen süre uykumu etkiler.",
  "Yemek yerken bile telefonumu kontrol ederim.",
  "Dijital cihazlar işlerimi aksatacak kadar dikkatimi dağıtır.",
  "Boş zamanlarımda ilk tercihim dijital cihazlar olur.",
  "Sosyal medya paylaşımları ruh halimi etkiler.",
  "Dijital cihazlara erişimim olmadığında kendimi yalnız hissederim.",
  "Günlük işlerimi dijital cihazlara göre planlarım."
];

let currentQuestionIndex = 0;
let answers = [];
let userData = {};
const totalQuestions = questions.length;

// HTML elemanları
const loginScreen = document.getElementById('login-screen');
const surveyScreen = document.getElementById('survey-screen');
const resultScreen = document.getElementById('result-screen');
const adminScreen = document.getElementById('admin-screen');

const emailInput = document.getElementById('email');
const ageInput = document.getElementById('age');
const genderInput = document.getElementById('gender');
const adminPasswordInput = document.getElementById('admin-password');

const questionContainer = document.getElementById('question-container');
const likertOptions = document.getElementsByName('answer');

const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

const resultText = document.getElementById('result-text');
const adviceText = document.getElementById('advice-text');
const resultChartCtx = document.getElementById('result-chart').getContext('2d');

const adminChartCtx = document.getElementById('admin-chart').getContext('2d');

const loginError = document.getElementById('login-error');

const startSurveyBtn = document.getElementById('start-survey-btn');
const adminLoginBtn = document.getElementById('admin-login-btn');
const restartBtn = document.getElementById('restart-btn');
const filterBtn = document.getElementById('filter-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const adminLogoutBtn = document.getElementById('admin-logout-btn');

let resultChart;
let adminChart;

// Anket başlat
startSurveyBtn.onclick = () => {
  const email = emailInput.value.trim();
  const age = parseInt(ageInput.value);
  const gender = genderInput.value;

  if (!email || !age || !gender) {
    loginError.textContent = "Lütfen tüm alanları doldurun.";
    return;
  }
  loginError.textContent = "";
  userData = { email, age, gender };
  answers = new Array(totalQuestions);
  currentQuestionIndex = 0;
  showQuestion(currentQuestionIndex);
  loginScreen.classList.add('hidden');
  surveyScreen.classList.remove('hidden');
};

// Admin girişi
adminLoginBtn.onclick = () => {
  const pass = adminPasswordInput.value;
  if (pass === "admin1234") { // Basit şifre, backend tarafında da kontrol edilmeli
    loginError.textContent = "";
    loginScreen.classList.add('hidden');
    adminScreen.classList.remove('hidden');
    fetchStats();
  } else {
    loginError.textContent = "Geçersiz admin şifresi.";
  }
};

// Soru gösterimi
function showQuestion(index) {
  questionContainer.textContent = `Soru ${index + 1}: ${questions[index]}`;
  // Önceki cevabı işaretle
  for (const option of likertOptions) {
    option.checked = answers[index] == option.value;
  }
  prevBtn.disabled = index === 0;
  nextBtn.textContent = (index === totalQuestions - 1) ? "Anketi Bitir" : "İleri";
}

// İleri butonu
nextBtn.onclick = () => {
  const selected = Array.from(likertOptions).find(r => r.checked);
  if (!selected) {
    alert("Lütfen bir seçenek işaretleyin.");
    return;
  }
  answers[currentQuestionIndex] = parseInt(selected.value);
  if (currentQuestionIndex === totalQuestions - 1) {
    finishSurvey();
  } else {
    currentQuestionIndex++;
    showQuestion(currentQuestionIndex);
  }
};

// Geri butonu
prevBtn.onclick = () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    showQuestion(currentQuestionIndex);
  }
};

// Anketi bitir
function finishSurvey() {
  // Toplam puan
  const totalScore = answers.reduce((a,b) => a+b, 0);
  const maxScore = totalQuestions * 5;
  let level = "";
  let advice = "";

  const percent = (totalScore / maxScore) * 100;
  if (percent >= 80) {
    level = "Yüksek Dijital Bağımlılık";
    advice = "Dijital cihaz kullanımınızı sınırlandırmanızı öneririz.";
  } else if (percent >= 50) {
    level = "Orta Dijital Bağımlılık";
    advice = "Daha dengeli bir dijital cihaz kullanımı için dikkatli olun.";
  } else {
    level = "Düşük Dijital Bağımlılık";
    advice = "Sağlıklı dijital alışkanlıklarınızı koruyun.";
  }

  resultText.textContent = `Durumunuz: ${level} (${totalScore} / ${maxScore})`;
  adviceText.textContent = advice;

  // Grafik gösterimi
  if(resultChart) resultChart.destroy();

  resultChart = new Chart(resultChartCtx, {
    type: 'bar',
    data: {
      labels: ['Puanınız', 'Maksimum'],
      datasets: [{
        label: 'Dijital Bağımlılık Puanı',
        data: [totalScore, maxScore],
        backgroundColor: ['#0066cc', '#ccc']
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, max: maxScore }
      }
    }
  });

  surveyScreen.classList.add('hidden');
  resultScreen.classList.remove('hidden');

  // Verileri backend'e gönder
  saveSurvey(userData, answers, totalScore);
}

// Anket verisini kaydet (backend'e POST)
async function saveSurvey(user, answers, totalScore) {
  try {
    const response = await fetch('/api/save-survey', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({user, answers, totalScore})
    });
    if (!response.ok) {
      console.error('Veri kaydetme başarısız');
    }
  } catch (err) {
    console.error('Sunucu hatası:', err);
  }
}

// Yeniden başlat
restartBtn.onclick = () => {
  emailInput.value = "";
  ageInput.value = "";
  genderInput.value = "";
  answers = [];
  currentQuestionIndex = 0;
  resultScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
};

// Admin panel verilerini çek
async function fetchStats(filters = {}) {
  let query = "";
  if (filters.ageGroup) query += `ageGroup=${filters.ageGroup}&`;
  if (filters.gender) query += `gender=${filters.gender}&`;

  try {
    const response = await fetch('/api/admin/stats?' + query);
    const data = await response.json();
    drawAdminChart(data);
  } catch (err) {
    console.error('Admin veri çekme hatası:', err);
  }
}

// Admin grafiği çiz
function drawAdminChart(data) {
  if(adminChart) adminChart.destroy();

  const labels = data.map(d => d.label);
  const counts = data.map(d => d.count);

  adminChart = new Chart(adminChartCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Anket Katılımcı Sayısı',
        data: counts,
        backgroundColor: '#0066cc'
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

// Filtrele butonu
filterBtn.onclick = () => {
  const ageGroup = document.getElementById('age-filter').value;
  const gender = document.getElementById('gender-filter').value;
  fetchStats({ ageGroup, gender });
};

// CSV dışa aktar
exportCsvBtn.onclick = async () => {
  try {
    const response = await fetch('/api/admin/export-csv');
    if (!response.ok) throw new Error("CSV indirilemedi.");
    const csv = await response.text();

    // Dosyayı indir
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dijianket_sonuclari.csv';
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert("CSV indirme hatası: " + err.message);
  }
};

// Admin çıkış
adminLogoutBtn.onclick = () => {
  adminScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  adminPasswordInput.value = "";
  loginError.textContent = "";
};
