// 빠로로 테마 공부 타이머 앱

const DEFAULT_SUBJECTS = [
  { id: 1, name: '국어', icon: '📖', color: '#4CAF50', time: 0 },
  { id: 2, name: '영어', icon: '🔤', color: '#2196F3', time: 0 },
  { id: 3, name: '수학', icon: '📐', color: '#FF9800', time: 0 },
  { id: 4, name: '사회', icon: '🌍', color: '#9C27B0', time: 0 },
  { id: 5, name: '과학', icon: '🔬', color: '#00BCD4', time: 0 },
  { id: 6, name: '기술', icon: '💻', color: '#607D8B', time: 0 },
];

let subjects = JSON.parse(localStorage.getItem('studySubjects')) || structuredClone(DEFAULT_SUBJECTS);
let activeSubjectId = null;
let timerInterval = null;
let startTimestamp = null;

// 유틸
function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getTotalSeconds() {
  return subjects.reduce((sum, s) => sum + s.time, 0);
}

function saveSubjects() {
  localStorage.setItem('studySubjects', JSON.stringify(subjects));
}

// 렌더링
function renderSubjects() {
  const list = document.getElementById('subjectList');
  list.innerHTML = subjects.map(sub => `
    <div class="subject-item ${activeSubjectId === sub.id ? 'running' : ''}" data-id="${sub.id}">
      <div class="subject-icon" style="background:${sub.color}22">${sub.icon}</div>
      <div class="subject-name">${sub.name}</div>
      <div class="subject-time">
        ${activeSubjectId === sub.id ? '<span class="running-dot"></span>' : ''}
        ${formatTime(sub.time)}
      </div>
      <div class="subject-menu" data-id="${sub.id}">⋮</div>
    </div>
  `).join('');

  // 클릭 이벤트
  list.querySelectorAll('.subject-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('subject-menu')) return;
      const id = Number(item.dataset.id);
      toggleTimer(id);
    });
  });

  updateTotalTime();
}

function updateTotalTime() {
  document.getElementById('totalTime').textContent = formatTime(getTotalSeconds());
}

// 타이머 로직
function toggleTimer(id) {
  if (activeSubjectId === id) {
    // 정지
    stopTimer();
  } else {
    // 다른 과목 시작 (기존 것이 있으면 먼저 저장)
    if (activeSubjectId !== null) {
      stopTimer();
    }
    startTimer(id);
  }
  renderSubjects();
}

function startTimer(id) {
  activeSubjectId = id;
  startTimestamp = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
    const sub = subjects.find(s => s.id === id);
    if (sub) {
      updateLiveTime(id, elapsed);
    }
  }, 1000);
  renderSubjects();
}

function updateLiveTime(id, extraSeconds) {
  const base = subjects.find(s => s.id === id)?.time || 0;
  const totalEl = document.getElementById('totalTime');
  const item = document.querySelector(`.subject-item[data-id="${id}"] .subject-time`);
  if (item) {
    item.innerHTML = `<span class="running-dot"></span>${formatTime(base + extraSeconds)}`;
  }
  // 총합도 임시로
  const otherTotal = subjects.reduce((sum, s) => sum + (s.id === id ? 0 : s.time), 0);
  totalEl.textContent = formatTime(otherTotal + base + extraSeconds);
}

function stopTimer() {
  if (activeSubjectId === null || !startTimestamp) return;

  const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
  const sub = subjects.find(s => s.id === activeSubjectId);
  if (sub) {
    sub.time += elapsed;
  }

  clearInterval(timerInterval);
  timerInterval = null;
  activeSubjectId = null;
  startTimestamp = null;
  saveSubjects();
  renderSubjects();
}

// 저장 카드 생성
function generateShareCard() {
  const total = getTotalSeconds();
  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  });

  const subjectsHtml = subjects
    .filter(s => s.time > 0)
    .map(s => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f0e8dc;">
        <span style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">${s.icon}</span>
          <span style="font-weight:500;">${s.name}</span>
        </span>
        <span style="font-weight:600;font-variant-numeric:tabular-nums;">${formatTime(s.time)}</span>
      </div>
    `).join('') || '<div style="padding:20px;text-align:center;color:#aaa;">아직 공부한 기록이 없어요</div>';

  return `
    <div style="background:linear-gradient(180deg,#4FC3F7 0%,#E1F5FE 100%);padding:24px 20px 16px;text-align:center;">
      <div style="font-size:13px;color:#0277BD;margin-bottom:4px;">${dateStr}</div>
      <div style="font-size:48px;margin:8px 0;">🐧</div>
      <div style="font-size:14px;color:#546E7A;">오늘의 공부 시간</div>
      <div style="font-size:42px;font-weight:700;color:#01579B;letter-spacing:-1px;margin:4px 0 8px;">
        ${formatTime(total)}
      </div>
      <div style="font-size:13px;color:#0288D1;font-weight:600;">빠로로와 함께 수고했어! ❄️</div>
    </div>
    <div style="padding:16px 20px 20px;background:#fffef8;">
      ${subjectsHtml}
      <div style="margin-top:16px;text-align:center;font-size:12px;color:#90A4AE;">
        빠로로와 함께하는 공부하루 🐧
      </div>
    </div>
  `;
}

// 이벤트 바인딩
document.getElementById('saveBtn').addEventListener('click', () => {
  // 실행 중이면 먼저 저장
  if (activeSubjectId !== null) stopTimer();

  const preview = document.getElementById('cardPreview');
  preview.innerHTML = generateShareCard();
  document.getElementById('saveModal').classList.add('show');
});

document.getElementById('shareBtn').addEventListener('click', async () => {
  if (activeSubjectId !== null) stopTimer();

  const preview = document.getElementById('cardPreview');
  preview.innerHTML = generateShareCard();
  document.getElementById('saveModal').classList.add('show');

  // Web Share API 지원 시
  if (navigator.share) {
    try {
      await navigator.share({
        title: '오늘의 공부 기록',
        text: `오늘 ${formatTime(getTotalSeconds())} 공부했어요! 🐧 빠로로와 함께!`,
      });
    } catch (e) {}
  }
});

document.getElementById('closeModal').addEventListener('click', () => {
  document.getElementById('saveModal').classList.remove('show');
});

document.getElementById('downloadBtn').addEventListener('click', async () => {
  const card = document.getElementById('cardPreview');
  try {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>오늘의 공부 기록</title>
          <style>
            body { font-family: -apple-system, sans-serif; margin: 0; padding: 20px; background: #faf6f0; }
            .card { max-width: 360px; margin: 0 auto; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.12); }
          </style>
        </head>
        <body>
          <div class="card">${card.innerHTML}</div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (e) {
    alert('저장에 실패했습니다. 스크린샷을 찌어주세요!');
  }
});

document.getElementById('copyBtn').addEventListener('click', async () => {
  const text = `🐧 빠로로와 함께한 오늘의 공부 기록\n총 ${formatTime(getTotalSeconds())}\n\n` +
    subjects.filter(s => s.time > 0).map(s => `${s.icon} ${s.name}: ${formatTime(s.time)}`).join('\n');

  try {
    await navigator.clipboard.writeText(text);
    alert('텍스트로 복사되었습니다!');
  } catch (e) {
    alert('복사에 실패했습니다.');
  }
});

// 과목 편집
document.getElementById('editSubjectsBtn').addEventListener('click', () => {
  const editList = document.getElementById('editList');
  editList.innerHTML = subjects.map((s, idx) => `
    <div class="edit-item" data-idx="${idx}">
      <input type="text" value="${s.name}" data-field="name">
      <button class="delete-btn" data-idx="${idx}">✕</button>
    </div>
  `).join('');

  editList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.idx);
      subjects.splice(idx, 1);
      document.getElementById('editSubjectsBtn').click(); // 다시 렌더
    });
  });

  document.getElementById('editModal').classList.add('show');
});

document.getElementById('closeEditModal').addEventListener('click', () => {
  document.getElementById('editModal').classList.remove('show');
});

document.getElementById('addSubjectBtn').addEventListener('click', () => {
  const icons = ['📚', '✏️', '🧠', '📝', '🎯', '⭐', '💡', '🔥'];
  const colors = ['#E91E63', '#9C27B0', '#3F51B5', '#009688', '#FF5722', '#795548'];
  subjects.push({
    id: Date.now(),
    name: '새 과목',
    icon: icons[Math.floor(Math.random() * icons.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
    time: 0
  });
  document.getElementById('editSubjectsBtn').click();
});

document.getElementById('saveEditBtn').addEventListener('click', () => {
  const inputs = document.querySelectorAll('#editList input[data-field="name"]');
  inputs.forEach((input, idx) => {
    if (subjects[idx]) subjects[idx].name = input.value.trim() || subjects[idx].name;
  });
  saveSubjects();
  renderSubjects();
  document.getElementById('editModal').classList.remove('show');
});

// 탭 (시각적만)
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});

// 초기화
renderSubjects();

// 페이지 떠날 때 타이머 저장
window.addEventListener('beforeunload', () => {
  if (activeSubjectId !== null) stopTimer();
});
