/* S.M.HP ビジネスプラン 共通スクリプト */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  /* ---------------------------------------------------------
     ページ遷移時のスクロール位置(シンプル/スタンダードと同じ仕組み)
     --------------------------------------------------------- */
  var SCROLL_KEY = 'smhp-biz-scroll:' + location.pathname;
  var navEntry = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || null;
  var navType = navEntry ? navEntry.type : (performance.navigation && performance.navigation.type === 2 ? 'back_forward' : 'navigate');
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function jump(y) {
    try { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); }
    catch (e) { window.scrollTo(0, y); }
  }
  function headerOffset() {
    var h = document.querySelector('.site-header');
    return (h ? h.getBoundingClientRect().height : 0) + 16;
  }
  function hashTarget() {
    if (!location.hash || location.hash === '#top') return null;
    try { return document.getElementById(decodeURIComponent(location.hash.slice(1))); }
    catch (e) { return null; }
  }
  function savedY() {
    try { var v = sessionStorage.getItem(SCROLL_KEY); return v === null ? null : Number(v); }
    catch (e) { return null; }
  }
  var userMoved = false;
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) {
    window.addEventListener(ev, function () { userMoved = true; }, { passive: true, once: true });
  });
  function settleScroll() {
    if (userMoved) return;
    if (navType === 'back_forward') {
      var y = savedY();
      if (y !== null) { jump(y); return; }
    }
    var t = hashTarget();
    if (t) { jump(Math.max(0, t.getBoundingClientRect().top + window.pageYOffset - headerOffset())); return; }
    jump(0);
    if (window.self !== window.top && !location.hash) {
      var top = document.getElementById('top');
      if (top && top.scrollIntoView) top.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }
  settleScroll();
  document.addEventListener('DOMContentLoaded', settleScroll);
  window.addEventListener('load', function () { settleScroll(); setTimeout(settleScroll, 120); });
  var saveTimer = null;
  window.addEventListener('scroll', function () {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { sessionStorage.setItem(SCROLL_KEY, String(Math.round(window.pageYOffset))); } catch (e) { /* 動作に影響なし */ }
    }, 100);
  }, { passive: true });

  /* ---------------- スマートフォン用メニュー ---------------- */
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('gnav');
  function closeMenu() {
    if (!btn || !nav) return;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'メニューを開く');
    nav.classList.remove('is-open');
  }
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      btn.setAttribute('aria-label', open ? 'メニューを開く' : 'メニューを閉じる');
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------------- 画像が読み込めない場合は差し替え枠 ---------------- */
  document.querySelectorAll('.ph img').forEach(function (img) {
    function miss() { var box = img.closest('.ph'); if (box) box.classList.add('is-missing'); }
    if (img.complete && img.naturalWidth === 0) miss();
    img.addEventListener('error', miss);
  });

  /* ---------------- ページトップボタン ---------------- */
  var pageTop = document.querySelector('.pagetop');
  if (pageTop) {
    var onScroll = function () { pageTop.classList.toggle('is-show', window.scrollY > 400); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- スクロール表示(控えめ・最終的に必ず表示) ---------------- */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
    window.addEventListener('load', function () {
      setTimeout(function () { items.forEach(function (el) { el.classList.add('is-in'); }); }, 2500);
    });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------- 地図(公開サイトでは埋め込み、プレビューでは案内カード) ---------------- */
  document.querySelectorAll('[data-map-src]').forEach(function (wrap) {
    if (window.self !== window.top) return;
    var f = document.createElement('iframe');
    f.src = wrap.getAttribute('data-map-src');
    f.title = wrap.getAttribute('data-map-title') || '地図';
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    f.setAttribute('allowfullscreen', '');
    wrap.appendChild(f);
  });

  /* ---------------- 施工実績一覧:工事の種類で絞り込み ---------------- */
  var list = document.querySelector('[data-works]');
  var filterBtns = document.querySelectorAll('[data-filter]');
  var status = document.querySelector('[data-works-status]');
  if (list && filterBtns.length) {
    var names = {};
    filterBtns.forEach(function (b) { names[b.getAttribute('data-filter')] = b.getAttribute('data-label'); });
    var applyFilter = function (cat) {
      if (!names[cat]) cat = 'all';
      var n = 0;
      list.querySelectorAll('li').forEach(function (li) {
        var show = cat === 'all' || li.getAttribute('data-cat') === cat;
        li.hidden = !show;
        if (show) n++;
      });
      filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === cat)); });
      if (status) status.textContent = names[cat] + ':' + n + '件';
    };
    filterBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var cat = b.getAttribute('data-filter');
        applyFilter(cat);
        try { history.replaceState(null, '', cat === 'all' ? location.pathname : '#' + cat); } catch (e) { /* 影響なし */ }
      });
    });
    applyFilter(location.hash ? location.hash.slice(1) : 'all');
  }

  /* ---------------- 写真の拡大表示(実績詳細ページ) ----------------
     [data-lb-item] を持つボタンが対象。data-full=拡大画像、data-caption=説明 */
  var lb = document.getElementById('lightbox');
  var lbItems = Array.prototype.slice.call(document.querySelectorAll('[data-lb-item]'));
  if (lb && lbItems.length) {
    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('[data-lb-title]');
    var lbCount = lb.querySelector('[data-lb-count]');
    var nav2 = lb.querySelectorAll('.lb-prev, .lb-next');
    var cur = 0, lastFocus = null;
    if (lbItems.length < 2) nav2.forEach(function (b) { b.hidden = true; });
    var show = function (i) {
      cur = (i + lbItems.length) % lbItems.length;
      var it = lbItems[cur];
      lbImg.src = it.getAttribute('data-full');
      lbImg.alt = it.querySelector('img') ? it.querySelector('img').alt : '';
      lbCap.textContent = it.getAttribute('data-caption') || '';
      lbCount.textContent = lbItems.length > 1 ? (cur + 1) + ' / ' + lbItems.length : '';
    };
    var close = function () {
      lb.hidden = true;
      document.body.classList.remove('is-locked');
      lbImg.removeAttribute('src');
      if (lastFocus) lastFocus.focus();
    };
    lbItems.forEach(function (it, i) {
      it.addEventListener('click', function () {
        lastFocus = it; show(i); lb.hidden = false;
        document.body.classList.add('is-locked');
        lb.querySelector('.lb-close').focus();
      });
    });
    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(cur - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lightbox__stage')) close(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft' && lbItems.length > 1) show(cur - 1);
      else if (e.key === 'ArrowRight' && lbItems.length > 1) show(cur + 1);
      else if (e.key === 'Tab') {
        var f = Array.prototype.filter.call(lb.querySelectorAll('button'), function (b) { return !b.hidden; });
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx === null || lbItems.length < 2) return;
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }

  /* ---------------- お問い合わせフォーム ----------------
     入力チェック → contact.php へ送信 → 送信完了ページ(thanks.html)へ移動。
     JavaScript が使えない場合も、通常の送信で contact.php が処理します。
     プレビュー画面(他の画面への埋め込み)や、PCでファイルを直接開いた場合は
     サーバー処理が動かないため、送信せずにその旨を表示します。 */
  var form = document.querySelector('form[data-contact-form]');
  if (form) {
    var t = form.querySelector('input[name="t"]');
    if (t) t.value = String(Date.now());
    var result = form.querySelector('[data-form-result]');
    var sendBtn = form.querySelector('button[type="submit"]');
    // PHP が動かない場所(ファイルを直接開いた場合・プレビュー埋め込み・GitHub Pages)では送信しない
    var canSend = location.protocol.indexOf('http') === 0 && window.self === window.top && !/\.github\.io$/i.test(location.hostname);
    var previewNote = document.querySelector('[data-preview-note]');
    if (!canSend && previewNote) previewNote.hidden = false;

    // 採用ページからのリンク(contact.html#recruit)は「採用について」を選択
    if (location.hash === '#recruit') {
      var sel = form.querySelector('select[name="kind"]');
      if (sel) sel.value = '採用について';
    }

    var setError = function (el, msg) {
      var box = form.querySelector('[data-error-for="' + el.name + '"]');
      if (box) box.textContent = msg || '';
      if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    };
    var validate = function () {
      var first = null;
      form.querySelectorAll('[data-required]').forEach(function (el) {
        var msg = '';
        if (el.type === 'checkbox') { if (!el.checked) msg = el.getAttribute('data-required'); }
        else if (!el.value.trim()) msg = el.getAttribute('data-required');
        else if (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim())) msg = 'メールアドレスの形式をご確認ください。';
        setError(el, msg);
        if (msg && !first) first = el;
      });
      return first;
    };
    form.querySelectorAll('[data-required]').forEach(function (el) {
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'blur', function () {
        if (el.getAttribute('aria-invalid') === 'true' || el.type === 'checkbox') validate();
      });
    });
    var showResult = function (msg) { result.textContent = msg; result.hidden = false; };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      result.hidden = true;
      var first = validate();
      if (first) { first.focus(); showResult('未入力または確認が必要な項目があります。赤く表示された項目をご確認ください。'); return; }
      if (!canSend) { showResult('この画面は見本のため送信できません。PHP が使える公開サーバーにアップロードすると送信できます。'); return; }
      sendBtn.disabled = true;
      sendBtn.textContent = '送信しています…';
      fetch(form.getAttribute('action'), {
        method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' }
      }).then(function (r) {
        return r.json().catch(function () { return { ok: false, message: 'サーバーから正しい応答がありませんでした。PHPが使えるサーバーかご確認ください。' }; });
      }).then(function (data) {
        if (data && data.ok) { location.href = 'thanks.html'; return; }
        showResult((data && data.message) || '送信できませんでした。時間をおいて再度お試しいただくか、お電話でご連絡ください。');
        sendBtn.disabled = false; sendBtn.textContent = '送信する';
      }).catch(function () {
        showResult('通信エラーで送信できませんでした。時間をおいて再度お試しいただくか、お電話でご連絡ください。');
        sendBtn.disabled = false; sendBtn.textContent = '送信する';
      });
    });
  }

  /* ---------------- コピーライトの年 ---------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
