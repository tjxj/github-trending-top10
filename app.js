/**
 * GitHub 今日 Star 增长榜 TOP 10 - 前端逻辑
 */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// 语言颜色映射（GitHub 官方配色）
const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00add8',
  Rust: '#dea584',
  Swift: '#f05138',
  Ruby: '#701516',
  PHP: '#4f5d95',
  Kotlin: '#a97bff',
  Dart: '#00b4ab',
  Shell: '#89e051',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Lua: '#000080',
  Zig: '#ec915c',
  Scala: '#c22d40',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Unknown: '#8b949e',
};

// SVG 图标
const ICONS = {
  star: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>',
  fork: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 111.5 0v.878a2.25 2.25 0 01-2.25 2.25h-1.5v2.128a2.251 2.251 0 11-1.5 0V8.5h-1.5A2.25 2.25 0 013.5 6.25v-.878a2.25 2.25 0 111.5 0zM5 3.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0zm6.75.75a.75.75 0 10-1.5 0 .75.75 0 001.5 0zM8 12.75a.75.75 0 10-1.5 0 .75.75 0 001.5 0z"/></svg>',
  fire: '<svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M7.998 14.5c2.832 0 5-1.98 5-4.5 0-1.463-.68-2.19-1.879-3.383l-.036-.037c-1.013-1.008-2.3-2.29-2.834-4.434-.322.256-.63.557-.915.901-.418.503-.763 1.089-1.008 1.712a6.496 6.496 0 00-.376 2.156c0 .777.206 1.55.614 2.282.193.345.414.653.638.908l.005.006c.167.191.35.36.53.496l.007.005c.18.132.381.232.603.28a.748.748 0 00.32-.011c.218-.064.393-.184.522-.328.131-.147.226-.326.276-.52a1.18 1.18 0 00.009-.24c-.003-.13-.016-.26-.043-.38a2.256 2.256 0 00-.173-.484c-.1-.218-.242-.438-.424-.634l-.006-.006-.005-.006a.75.75 0 00-1.312.538v.008c.005.14.006.283-.014.423a2.735 2.735 0 01-.06.306 2.27 2.27 0 01-.107.311c-.044.1-.096.19-.154.265a1.352 1.352 0 01-.182.192l-.003.003a.863.863 0 01-.205.134.41.41 0 01-.083.034.47.47 0 01-.142.023.476.476 0 01-.152-.028 1.16 1.16 0 01-.307-.139 2.25 2.25 0 01-.39-.31c-.234-.24-.454-.536-.639-.87a4.397 4.397 0 01-.514-2.132 4.275 4.275 0 01.11-1.14 5.156 5.156 0 01.248-.826 4.5 4.5 0 01.193-.393c.095-.17.193-.326.297-.466.228-.312.481-.58.756-.803a4.81 4.81 0 01.43-.318 3.076 3.076 0 01.206-.13l.006-.003.005-.003a.75.75 0 00-.006-1.283c-.005-.003-.01-.006-.014-.009a3.155 3.155 0 00-.342-.182 3.402 3.402 0 00-.763-.228c-.293-.045-.636-.07-1.028-.07-.754 0-1.44.105-2.035.336a3.32 3.32 0 00-1.398 1.003 3.764 3.764 0 00-.669 1.277c-.13.38-.202.78-.202 1.2 0 .674.11 1.354.338 2.025.227.67.577 1.32 1.063 1.914.444.542.985 1.005 1.644 1.351.57.299 1.157.453 1.713.453z"/></svg>',
};

// 全局状态
let allData = null;
let allItems = [];
let currentLang = '';

/**
 * 初始化
 */
async function init() {
  await loadData('latest');
  await loadDateIndex();
  bindEvents();
}

/**
 * 加载数据
 */
async function loadData(dateOrLatest) {
  const list = $('#rankingList');
  list.innerHTML = '';

  // 显示骨架屏
  for (let i = 0; i < 5; i++) {
    list.innerHTML += createSkeletonHTML();
  }

  const file = dateOrLatest === 'latest' ? 'latest.json' : `${dateOrLatest}.json`;

  try {
    const resp = await fetch(`data/${file}?t=${Date.now()}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    allData = data;
    allItems = data.items || [];
    currentLang = '';

    // 更新筛选器
    updateLangFilter(data.languages || []);

    // 更新时间
    $('#updateTime').textContent = data.updatedAt || '未知';

    // 渲染
    renderItems(allItems);
    updateSummary(allItems);
  } catch (err) {
    console.error('Failed to load data:', err);
    list.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <p>数据加载失败，请检查网络连接或稍后再试</p>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.5rem">${err.message}</p>
      </div>
    `;
  }
}

/**
 * 加载日期索引
 */
async function loadDateIndex() {
  try {
    const resp = await fetch('data/index.json?t=' + Date.now());
    if (!resp.ok) return;
    const index = await resp.json();
    const picker = $('#datePicker');

    (index.dates || []).forEach(date => {
      const opt = document.createElement('option');
      opt.value = date;
      opt.textContent = date;
      picker.appendChild(opt);
    });
  } catch (e) {
    // index.json 不存在时忽略
  }
}

/**
 * 更新语言筛选器
 */
function updateLangFilter(languages) {
  const filter = $('#langFilter');
  const currentVal = filter.value;

  // 保留"全部语言"选项
  filter.innerHTML = '<option value="">全部语言</option>';
  languages.forEach(lang => {
    const opt = document.createElement('option');
    opt.value = lang;
    opt.textContent = lang;
    filter.appendChild(opt);
  });

  // 恢复之前的选择
  if (languages.includes(currentVal)) {
    filter.value = currentVal;
  }
}

/**
 * 渲染项目列表
 */
function renderItems(items) {
  const list = $('#rankingList');

  if (items.length === 0) {
    list.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>没有找到符合条件的项目</p>
      </div>
    `;
    return;
  }

  list.innerHTML = items.map((item, idx) => createCardHTML(item, idx)).join('');
}

/**
 * 创建卡片 HTML
 */
function createCardHTML(item, idx) {
  const rank = idx + 1;
  const rankClass = rank <= 3 ? ` rank-${rank}` : '';
  const langColor = LANG_COLORS[item.language] || LANG_COLORS['Unknown'];
  const avatarHTML = item.avatarUrl
    ? `<img src="${item.avatarUrl}" alt="${item.repo}" loading="lazy" />`
    : `<span style="font-size:1.5rem;">📦</span>`;

  return `
    <div class="repo-card" onclick="window.open('${item.url}', '_blank')">
      <div class="rank-badge${rankClass}">${rank}</div>
      <div class="repo-avatar">${avatarHTML}</div>
      <div class="repo-info">
        <a class="repo-name" href="${item.url}" target="_blank" onclick="event.stopPropagation()">${item.repo}</a>
        <div class="repo-desc">${escapeHTML(item.description)}</div>
        <div class="repo-stats">
          <span class="stat-item stat-today">
            ${ICONS.fire} +${formatNumber(item.todayStars)} today
          </span>
          <span class="stat-item stat-stars">
            ${ICONS.star} ${formatNumber(item.totalStars)}
          </span>
          <span class="stat-item">
            ${ICONS.fork} ${formatNumber(item.forks)}
          </span>
          <span class="stat-item">
            <span class="lang-dot" style="background:${langColor}"></span>
            ${item.language}
          </span>
        </div>
      </div>
    </div>
  `;
}

/**
 * 创建骨架屏 HTML
 */
function createSkeletonHTML() {
  return `
    <div class="skeleton-card">
      <div class="skeleton-header">
        <div class="skeleton-rank"></div>
        <div class="skeleton-avatar"></div>
        <div class="skeleton-info">
          <div class="skeleton-title"></div>
          <div class="skeleton-desc"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 更新摘要统计
 */
function updateSummary(items) {
  const totalStars = items.reduce((sum, i) => sum + (i.todayStars || 0), 0);
  const langCount = {};
  items.forEach(i => {
    if (i.language && i.language !== 'Unknown') {
      langCount[i.language] = (langCount[i.language] || 0) + 1;
    }
  });
  const topLang = Object.entries(langCount).sort((a, b) => b[1] - a[1])[0];

  $('#totalTodayStars').textContent = '+' + formatNumber(totalStars);
  $('#topLanguage').textContent = topLang ? topLang[0] : '--';
  $('#repoCount').textContent = items.length;
}

/**
 * 绑定事件
 */
function bindEvents() {
  // 语言筛选
  $('#langFilter').addEventListener('change', (e) => {
    currentLang = e.target.value;
    filterAndRender();
  });

  // 日期切换
  $('#datePicker').addEventListener('change', (e) => {
    loadData(e.target.value);
  });

  // 刷新按钮
  $('#refreshBtn').addEventListener('click', () => {
    const btn = $('#refreshBtn');
    btn.classList.add('spinning');
    loadData($('#datePicker').value).finally(() => {
      setTimeout(() => btn.classList.remove('spinning'), 500);
    });
  });
}

/**
 * 筛选并渲染
 */
function filterAndRender() {
  let filtered = allItems;

  if (currentLang) {
    filtered = allItems.filter(i => i.language === currentLang);
  }

  renderItems(filtered);
  updateSummary(filtered);
}

/**
 * 格式化数字
 */
function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

/**
 * HTML 转义
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 启动
document.addEventListener('DOMContentLoaded', init);
