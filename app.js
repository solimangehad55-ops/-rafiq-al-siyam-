import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

import './style.css';

const native = Capacitor.isNativePlatform();
const STORAGE = {
  tasks: 'ras_tasks',
  tasbeeh: 'ras_tasbeeh',
  streak: 'ras_streak',
  settings: 'ras_settings',
  notificationIds: 'ras_notification_ids'
};

const defaults = {
  notifications: true,
  reminderTime: '20:00',
  suhoorTime: '03:45',
  horizonDays: 120
};

const state = {
  settings: load(STORAGE.settings, defaults),
  tasks: load(STORAGE.tasks, { date: todayKey(), quran:false, morning:false, evening:false }),
  tasbeeh: load(STORAGE.tasbeeh, { date: todayKey(), value:0 }),
  streak: load(STORAGE.streak, { date:'', value:0 })
};

function load(key, fallback){
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

function todayKey(date = new Date()){
  return date.toISOString().slice(0,10);
}

function arDate(date){
  return new Intl.DateTimeFormat('ar-EG-u-ca-islamic-umalqura', {
    day:'numeric', month:'long', year:'numeric'
  }).format(date);
}

function hijriParts(date){
  const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
    day:'numeric', month:'numeric', year:'numeric'
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(p => ['day','month','year'].includes(p.type)).map(p => [p.type, Number(p.value)]));
}

function gregorianLabel(date){
  return new Intl.DateTimeFormat('ar-EG', { weekday:'long', day:'numeric', month:'long', year:'numeric' }).format(date);
}

function pad(n){ return String(n).padStart(2,'0'); }

function formatShort(date){
  return new Intl.DateTimeFormat('ar-EG', { day:'numeric', month:'short' }).format(date);
}

function getFastingDates(horizon = 120){
  const out = [];
  const start = new Date();
  start.setHours(0,0,0,0);

  for(let i=0;i<horizon;i++){
    const d = new Date(start);
    d.setDate(start.getDate()+i);
    const weekday = d.getDay(); // 0 الأحد ... 1 الاثنين ... 4 الخميس
    const hp = hijriParts(d);
    const mondayThursday = weekday === 1 || weekday === 4;
    const whiteDays = [13,14,15].includes(hp.day);

    if(mondayThursday || whiteDays){
      const types = [];
      if(weekday === 1) types.push('الاثنين');
      if(weekday === 4) types.push('الخميس');
      if(whiteDays) types.push(`اليوم الأبيض ${hp.day}`);
      out.push({ date:d, hijri:hp, type:types.join(' • ') });
    }
  }
  return out;
}

function renderDates(){
  const list = document.querySelector('#fastingList');
  const dates = getFastingDates(60).slice(0,7);
  list.innerHTML = dates.map(item => `
    <article class="fasting-card">
      <div class="fasting-date">${formatShort(item.date)}</div>
      <div class="fasting-copy">
        <strong>${item.type}</strong>
        <small>${arDate(item.date)}</small>
      </div>
      <span class="fast-badge">صيام</span>
    </article>
  `).join('');
}

function normalizeDailyState(){
  const key = todayKey();
  if(state.tasks.date !== key){
    state.tasks = { date:key, quran:false, morning:false, evening:false };
    save(STORAGE.tasks, state.tasks);
  }
  if(state.tasbeeh.date !== key){
    state.tasbeeh = { date:key, value:0 };
    save(STORAGE.tasbeeh, state.tasbeeh);
  }
}

function render(){
  normalizeDailyState();
  const now = new Date();
  document.querySelector('#todayText').textContent = gregorianLabel(now);
  document.querySelector('#hijriDate').textContent = arDate(now);
  document.querySelector('#gregorianDate').textContent = gregorianLabel(now);

  for(const input of document.querySelectorAll('[data-task]')){
    input.checked = Boolean(state.tasks[input.dataset.task]);
  }
  const done = ['quran','morning','evening'].filter(k => state.tasks[k]).length;
  document.querySelector('#taskProgress').textContent = `${done}/3`;
  document.querySelector('#tasbeehValue').textContent = state.tasbeeh.value;
  document.querySelector('#tasbeehBtn').textContent = state.tasbeeh.value;
  document.querySelector('#streakValue').textContent = state.streak.value;

  document.querySelector('#reminderTime').value = state.settings.reminderTime;
  document.querySelector('#suhoorTime').value = state.settings.suhoorTime;
  document.querySelector('#notifyToggle').classList.toggle('on', state.settings.notifications);
}

function showToast(message){
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(()=>el.classList.remove('show'), 3000);
}

function updateStreak(){
  const done = ['quran','morning','evening'].every(k => state.tasks[k]);
  if(!done) return;
  const today = todayKey();
  if(state.streak.date === today) return;
  const prev = new Date();
  prev.setDate(prev.getDate()-1);
  const prevKey = todayKey(prev);
  state.streak.value = state.streak.date === prevKey ? state.streak.value + 1 : 1;
  state.streak.date = today;
  save(STORAGE.streak, state.streak);
}

async function setupNotifications(){
  if(!native){
    document.querySelector('#notificationStatus').textContent =
      'نسخة المتصفح لا تستطيع ضمان إشعارات مجدولة عند إغلاق الصفحة. شغّل نسخة Android للحصول على الإشعارات المحلية.';
    return false;
  }

  try{
    let permission = await LocalNotifications.checkPermissions();
    if(permission.display !== 'granted'){
      permission = await LocalNotifications.requestPermissions();
    }
    if(permission.display !== 'granted'){
      showToast('لم يتم السماح بالإشعارات.');
      return false;
    }

    await LocalNotifications.createChannel({
      id: 'fasting',
      name: 'تذكيرات الصيام',
      description: 'تذكيرات النية والسحور',
      importance: 4,
      visibility: 1,
      sound: 'default'
    });

    return true;
  }catch(error){
    console.error(error);
    showToast('حدث خطأ في إعداد الإشعارات.');
    return false;
  }
}

function timeOnDate(date, hhmm){
  const [h,m] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h,m,0,0);
  return d;
}

function notificationId(date, kind){
  const raw = `${todayKey(date).replaceAll('-','')}${kind}`;
  let n = 0;
  for(const ch of raw) n = (n * 31 + ch.charCodeAt(0)) % 2000000000;
  return Math.max(1000, n);
}

async function clearScheduledNotifications(){
  const oldIds = load(STORAGE.notificationIds, []);
  if(oldIds.length){
    try{
      await LocalNotifications.cancel({
        notifications: oldIds.map(id => ({ id }))
      });
    }catch(error){ console.warn(error); }
  }
  save(STORAGE.notificationIds, []);
}

async function scheduleFastingNotifications(){
  if(!native){
    showToast('الإشعارات المجدولة متاحة في نسخة Android.');
    return;
  }

  if(!state.settings.notifications){
    await clearScheduledNotifications();
    document.querySelector('#notificationStatus').textContent = 'الإشعارات متوقفة.';
    showToast('تم إيقاف إشعارات الصيام.');
    return;
  }

  const ready = await setupNotifications();
  if(!ready) return;

  // نحاول استخدام التوقيت الدقيق، لكن لا نجعل التطبيق يفشل إذا رفض المستخدم صلاحية المنبهات الدقيقة.
  try{
    const exact = await LocalNotifications.checkExactNotificationSetting();
    if(exact?.exact_alarm && exact.exact_alarm !== 'granted'){
      document.querySelector('#notificationStatus').textContent =
        'السماح بالإشعارات موجود. للحصول على توقيت أدق، فعّل "المنبهات والتذكيرات" من إعدادات Android.';
    }
  }catch{}

  await clearScheduledNotifications();

  const now = new Date();
  const dates = getFastingDates(state.settings.horizonDays);
  const notifications = [];
  const ids = [];

  for(const item of dates){
    const fastDate = item.date;

    const reminder = timeOnDate(new Date(fastDate.getTime() - 86400000), state.settings.reminderTime);
    const suhoor = timeOnDate(fastDate, state.settings.suhoorTime);

    if(reminder > now){
      const id = notificationId(fastDate, 'A');
      notifications.push({
        id,
        title: '🌙 تذكير بصيام الغد',
        body: `غدًا ${item.type}. لا تنسَ النية والاستعداد للصيام.`,
        channelId: 'fasting',
        schedule: { at: reminder, allowWhileIdle: true },
        sound: 'default',
        smallIcon: 'ic_stat_rafiq',
        extra: { kind:'reminder', date:todayKey(fastDate) }
      });
      ids.push(id);
    }

    if(suhoor > now){
      const id = notificationId(fastDate, 'B');
      notifications.push({
        id,
        title: '🌙 وقت السحور',
        body: `اليوم ${item.type}. لا تنسَ السحور والنية لصيامك.`,
        channelId: 'fasting',
        schedule: { at: suhoor, allowWhileIdle: true },
        sound: 'default',
        smallIcon: 'ic_stat_rafiq',
        extra: { kind:'suhoor', date:todayKey(fastDate) }
      });
      ids.push(id);
    }
  }

  if(!notifications.length){
    showToast('لا توجد مواعيد مستقبلية للجدولة.');
    return;
  }

  try{
    const result = await LocalNotifications.schedule({ notifications });
    save(STORAGE.notificationIds, ids);
    const warning = result?.warnings?.length ? ` (${result.warnings.length} تنبيه يحتاج مراجعة)` : '';
    document.querySelector('#notificationStatus').textContent =
      `تمت جدولة ${notifications.length} إشعارًا للأيام القادمة${warning}.`;
    showToast(`تمت جدولة ${notifications.length} إشعارًا 🔔`);
  }catch(error){
    console.error(error);
    document.querySelector('#notificationStatus').textContent =
      'تعذر الجدولة. تأكد من صلاحيات الإشعارات والمنبهات في Android.';
    showToast('تعذر جدولة الإشعارات.');
  }
}

async function testNotification(){
  if(!native){
    showToast('اختبار الإشعار يعمل داخل تطبيق Android.');
    return;
  }
  const ready = await setupNotifications();
  if(!ready) return;

  const id = 987654321;
  try{
    await LocalNotifications.cancel({ notifications:[{id}] });
  }catch{}

  await LocalNotifications.schedule({
    notifications:[{
      id,
      title:'🔔 رفيق الصيام',
      body:'هذا اختبار ناجح للإشعارات المحلية. ستعمل المواعيد المجدولة حتى مع إغلاق التطبيق العادي.',
      channelId:'fasting',
      schedule:{ at:new Date(Date.now()+10000), allowWhileIdle:true },
      sound:'default',
      smallIcon:'ic_stat_rafiq'
    }]
  });
  showToast('سيصل إشعار الاختبار بعد 10 ثوانٍ.');
}

document.addEventListener('DOMContentLoaded', async ()=>{
  render();
  renderDates();

  document.querySelectorAll('[data-task]').forEach(input=>{
    input.addEventListener('change', ()=>{
      state.tasks[input.dataset.task] = input.checked;
      save(STORAGE.tasks, state.tasks);
      updateStreak();
      render();
    });
  });

  document.querySelector('#tasbeehBtn').addEventListener('click', ()=>{
    state.tasbeeh.value++;
    save(STORAGE.tasbeeh, state.tasbeeh);
    render();
  });

  document.querySelector('#resetTasbeeh').addEventListener('click', ()=>{
    state.tasbeeh.value = 0;
    save(STORAGE.tasbeeh, state.tasbeeh);
    render();
  });

  document.querySelector('#themeBtn').addEventListener('click', ()=>{
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('ras_dark', document.documentElement.classList.contains('dark') ? '1':'0');
  });

  if(localStorage.getItem('ras_dark') === '1') document.documentElement.classList.add('dark');

  document.querySelector('#notifyToggle').addEventListener('click', ()=>{
    state.settings.notifications = !state.settings.notifications;
    save(STORAGE.settings, state.settings);
    render();
    if(!state.settings.notifications) clearScheduledNotifications();
  });

  document.querySelector('#reminderTime').addEventListener('change', e=>{
    state.settings.reminderTime = e.target.value;
    save(STORAGE.settings, state.settings);
  });

  document.querySelector('#suhoorTime').addEventListener('change', e=>{
    state.settings.suhoorTime = e.target.value;
    save(STORAGE.settings, state.settings);
  });

  document.querySelector('#scheduleBtn').addEventListener('click', scheduleFastingNotifications);
  document.querySelector('#testNotifyBtn').addEventListener('click', testNotification);

  document.querySelector('#settingsNav').addEventListener('click', ()=>{
    document.querySelector('.settings-card').scrollIntoView({behavior:'smooth'});
  });
  document.querySelector('#tasksNav').addEventListener('click', ()=>{
    document.querySelector('.tasks-card').scrollIntoView({behavior:'smooth'});
  });
  document.querySelector('#calendarBtn').addEventListener('click', ()=>{
    renderDates();
    showToast('يتم عرض أقرب أيام الصيام.');
  });

  // عند فتح التطبيق من جديد نعيد جدولة المواعيد القادمة.
  if(native && state.settings.notifications){
    setTimeout(()=>scheduleFastingNotifications(), 700);
  }
});
