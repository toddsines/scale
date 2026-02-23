/**
 * SCALE Films — Cloudflare Worker v5
 * Artist: Nu Vision | Album: The Seed | Label: Nation Records
 * Director/DP/Editor/Producer: Todd Sines | Mastering: Bob Weston
 * Slugs: nv-time, nv-shadow, nv-lullaby, nv-serious
 * Metadata: YouTube Data API v3 (description, tags, date, duration)
 * Player: YouTube IFrame API, controls:0, custom control bar
 */

// YT_API_KEY is now stored as a Cloudflare Worker environment variable (env.YT_API_KEY)
// Set it in wrangler.toml or the Cloudflare dashboard under Workers > Settings > Variables

// ─── Video registry ───────────────────────────────────────────────────────────
// credits[] is your hand-curated production crew.
// All other metadata (title, artist, description, tags, date, duration)
// is fetched live from YouTube Data API v3 on every page load.

// ── Shared production credits (same across all videos) ──────────────────────
const SHARED_CREDITS = [
  { role: 'Director',   name: 'Todd Sines' },
  { role: 'DP',         name: 'Todd Sines' },
  { role: 'Editor',     name: 'Todd Sines' },
  { role: 'Assistant Camera',   name: 'Andries Boekelman' },
  { role: 'Mastering',  name: 'Bob Weston' },
  { role: 'Label',      name: 'Nation Records' },
];

const VIDEOS = {
  'nv-time': {
    slug:      'nv-time',
    youtubeId: 'QkSGDIKiUBE',
    songTitle: 'Time',
    album:     'The Seed',
    credits:   SHARED_CREDITS,
  },
  'nv-shadow': {
    slug:      'nv-shadow',
    youtubeId: 'rV7JvrK6mY8',
    songTitle: 'Shadow In The Dark',
    album:     'The Seed',
    credits:   SHARED_CREDITS,
  },
  'nv-lullaby': {
    slug:      'nv-lullaby',
    youtubeId: 'aKwSdq4Xh_Q',
    songTitle: 'Lullaby Garden',
    album:     'The Seed',
    credits:   SHARED_CREDITS,
  },
  'nv-serious': {
    slug:      'nv-serious',
    youtubeId: '1hyTveLoThE',
    songTitle: 'R U Serious!?',
    album:     'The Seed',
    credits:   SHARED_CREDITS,
  },
};

const VIDEO_SLUGS = ['nv-time', 'nv-shadow', 'nv-lullaby', 'nv-serious'];


// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  @font-face{font-family:'CircularStd';src:url('https://raw.githubusercontent.com/toddsines/scale/main/fonts/CircularStd-Book.woff') format('woff');font-weight:400;font-style:normal;font-display:swap;}
  @font-face{font-family:'CircularStd';src:url('https://raw.githubusercontent.com/toddsines/scale/main/fonts/CircularStd-Medium.woff') format('woff');font-weight:500;font-style:normal;font-display:swap;}
  @font-face{font-family:'CircularStd';src:url('https://raw.githubusercontent.com/toddsines/scale/main/fonts/CircularStd-Black.otf') format('opentype');font-weight:900;font-style:normal;font-display:swap;}
  @font-face{font-family:'CircularMono';src:url('https://raw.githubusercontent.com/toddsines/scale/main/fonts/CircularXXMono-Regular.otf') format('opentype');font-weight:400;font-style:normal;font-display:swap;}

  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#080808;--text:#e0dbd4;--text-muted:#6a6560;
    --accent:#b5a48a;--border:#1c1c1c;--header-h:56px;--ctrl-h:52px;
    --font-body:'CircularStd','Helvetica Neue',Helvetica,Arial,sans-serif;
    --font-mono:'CircularMono','Courier New',monospace;
  }
  html{font-size:16px;scroll-behavior:smooth;}
  body{background:var(--bg);color:var(--text);font-family:var(--font-body);font-weight:400;
       line-height:1.6;min-height:100vh;-webkit-font-smoothing:antialiased;}
  a{color:inherit;text-decoration:none;}

  .build-line{opacity:0;transform:translateY(10px);
    transition:opacity .45s cubic-bezier(.22,1,.36,1),transform .45s cubic-bezier(.22,1,.36,1);}
  .build-line.visible{opacity:1;transform:translateY(0);}

  /* ── Header ── */
  .site-header{position:fixed;top:0;left:0;right:0;height:var(--header-h);
    display:flex;align-items:center;justify-content:space-between;
    padding:0 2rem;z-index:100;background:rgba(8,8,8,.92);
    backdrop-filter:blur(12px);border-bottom:1px solid var(--border);}
  .logo{font-family:var(--font-body);font-weight:900;font-size:.78rem;
        letter-spacing:.3em;text-transform:uppercase;color:var(--text);transition:color .2s;}
  .logo:hover{color:var(--accent);}
  .header-nav{display:flex;gap:2.5rem;}
  .header-nav a{font-family:var(--font-body);font-weight:400;font-size:.65rem;
                letter-spacing:.2em;text-transform:uppercase;color:var(--text-muted);transition:color .2s;}
  .header-nav a:hover{color:var(--text);}

  /* ── Video page — full bleed ── */
  .video-page{padding-top:var(--header-h);}
  .video-wrap{width:100%;background:#000;}

  /* ── Thumbnail ── */
  .yt-thumb{position:relative;display:block;width:100%;aspect-ratio:2.35/1;
            background:#000;cursor:pointer;overflow:hidden;}
  .yt-thumb img{position:absolute;inset:0;width:100%;height:100%;
                object-fit:cover;display:block;
                transition:transform .5s cubic-bezier(.25,.46,.45,.94);}
  .yt-thumb:hover img{transform:scale(1.02);}
  .yt-thumb__btn{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                 width:72px;background:none;border:none;cursor:pointer;padding:0;
                 transition:transform .2s,opacity .2s;opacity:.88;}
  .yt-thumb:hover .yt-thumb__btn{opacity:1;transform:translate(-50%,-50%) scale(1.1);}
  .yt-thumb__btn-bg{fill:rgba(0,0,0,.75);transition:fill .2s;}
  .yt-thumb:hover .yt-thumb__btn-bg{fill:rgba(0,0,0,.9);}
  .yt-thumb__btn-icon{fill:#fff;}

  /* ── Custom Player ── */
  .yt-player{position:relative;width:100%;aspect-ratio:2.35/1;background:#000;overflow:hidden;}
  .yt-player iframe{position:absolute;inset:0;width:100%;height:100%;border:none;}
  .yt-player__overlay{position:absolute;inset:0 0 var(--ctrl-h) 0;z-index:2;cursor:pointer;}

  /* ── Control bar ── */
  .yt-controls{position:absolute;bottom:0;left:0;right:0;height:var(--ctrl-h);
    display:flex;flex-direction:column;justify-content:flex-end;z-index:3;
    background:linear-gradient(transparent,rgba(0,0,0,.88));}
  .yt-progress{position:relative;width:100%;height:3px;
    background:rgba(255,255,255,.15);cursor:pointer;transition:height .15s;}
  .yt-controls:hover .yt-progress{height:5px;}
  .yt-progress__fill{position:absolute;top:0;left:0;bottom:0;background:var(--text);width:0%;pointer-events:none;}
  .yt-progress__thumb{position:absolute;top:50%;left:0%;
    width:12px;height:12px;border-radius:50%;background:var(--text);
    transform:translate(-50%,-50%) scale(0);pointer-events:none;transition:transform .15s;}
  .yt-controls:hover .yt-progress__thumb{transform:translate(-50%,-50%) scale(1);}
  .yt-ctrl-row{display:flex;align-items:center;padding:0 14px 10px;gap:4px;}
  .yt-btn{background:none;border:none;cursor:pointer;padding:6px;
          color:rgba(255,255,255,.85);display:flex;align-items:center;justify-content:center;transition:color .15s;}
  .yt-btn:hover{color:#fff;}
  .yt-btn svg{width:18px;height:18px;fill:currentColor;display:block;}
  .yt-btn--sm svg{width:15px;height:15px;}
  .yt-time{font-family:var(--font-mono);font-size:.6rem;letter-spacing:.06em;
           color:rgba(255,255,255,.7);margin-left:4px;white-space:nowrap;user-select:none;}
  .yt-spacer{flex:1;}
  .yt-vol-group{display:flex;align-items:center;}
  .yt-vol-wrap{display:flex;align-items:center;overflow:hidden;width:0;transition:width .2s;}
  .yt-vol-group:hover .yt-vol-wrap,.yt-vol-group:focus-within .yt-vol-wrap{width:72px;}
  .yt-volume{-webkit-appearance:none;appearance:none;width:64px;height:3px;
             background:rgba(255,255,255,.25);outline:none;cursor:pointer;border-radius:2px;margin-left:2px;}
  .yt-volume::-webkit-slider-thumb{-webkit-appearance:none;width:11px;height:11px;border-radius:50%;background:#fff;cursor:pointer;}
  .yt-volume::-moz-range-thumb{width:11px;height:11px;border-radius:50%;background:#fff;border:none;cursor:pointer;}
  .yt-quality-wrap{position:relative;}
  .yt-quality-btn{font-family:var(--font-mono);font-size:.55rem;letter-spacing:.08em;
    background:none;border:1px solid rgba(255,255,255,.25);color:rgba(255,255,255,.7);
    padding:3px 7px;cursor:pointer;transition:all .15s;border-radius:2px;white-space:nowrap;}
  .yt-quality-btn:hover{border-color:rgba(255,255,255,.6);color:#fff;}
  .yt-quality-menu{position:absolute;bottom:calc(100% + 8px);right:0;
    background:#111;border:1px solid #2a2a2a;display:none;flex-direction:column;min-width:80px;z-index:10;}
  .yt-quality-menu.open{display:flex;}
  .yt-quality-menu button{font-family:var(--font-mono);font-size:.55rem;letter-spacing:.08em;
    background:none;border:none;color:rgba(255,255,255,.6);
    padding:8px 12px;cursor:pointer;text-align:left;transition:all .15s;white-space:nowrap;}
  .yt-quality-menu button:hover{background:#1e1e1e;color:#fff;}
  .yt-quality-menu button.active{color:var(--accent);}

  /* ── Meta section ── */
  .video-meta{display:grid;grid-template-columns:1fr 1fr;gap:3rem;
              padding:3rem 3rem 2.5rem;border-bottom:1px solid var(--border);
              max-width:900px;margin:0 auto;}
  @media(max-width:700px){.video-meta{grid-template-columns:1fr;padding:2rem 1.5rem;max-width:100%;}}

  .video-title{font-family:var(--font-body);font-weight:900;
               font-size:clamp(1.8rem,4vw,2.8rem);color:var(--text);
               line-height:1.08;letter-spacing:-.02em;margin-bottom:.4rem;}
  .video-artist{font-family:var(--font-body);font-weight:400;font-size:.7rem;
                letter-spacing:.2em;text-transform:uppercase;color:var(--accent);margin-bottom:.6rem;}
  .video-date{font-family:var(--font-mono);font-size:.6rem;letter-spacing:.1em;
              color:var(--text-muted);margin-bottom:1.5rem;}
  .video-description{font-family:var(--font-body);font-weight:400;font-size:.95rem;
                     color:var(--text-muted);line-height:1.75;margin-bottom:1.5rem;
                     white-space:pre-line;}
  /* tags: SEO-only, not displayed */

  /* ── Credits ── */
  .credits-block{display:flex;flex-direction:column;gap:.9rem;padding-top:.25rem;}
  .credit-line{display:grid;grid-template-columns:160px 1fr;gap:.5rem;align-items:baseline;}
  .credit-role{font-family:var(--font-mono);font-size:.6rem;letter-spacing:.08em;
               text-transform:uppercase;color:var(--text-muted);padding-top:.12rem;}
  .credit-name{font-family:var(--font-body);font-weight:400;font-size:1rem;color:var(--text);}

  /* ── Video nav ── */
  .video-nav{display:flex;align-items:center;justify-content:space-between;
             padding:1.5rem 3rem;max-width:1400px;margin:0 auto;}
  .video-nav__link,.video-nav__index{font-family:var(--font-mono);font-size:.6rem;
    letter-spacing:.12em;text-transform:uppercase;color:var(--text-muted);
    transition:color .2s;display:flex;align-items:center;gap:.6rem;}
  .video-nav__link:hover,.video-nav__index:hover{color:var(--text);}

  /* ── Footer ── */
  .site-footer{margin-top:4rem;padding:1.5rem 2rem;border-top:1px solid var(--border);
               display:flex;justify-content:space-between;align-items:center;
               font-family:var(--font-mono);font-size:.6rem;letter-spacing:.1em;color:var(--text-muted);}

  /* ── Index ── */
  .index-header{padding:calc(var(--header-h) + 3rem) 2rem 2rem;
                border-bottom:1px solid var(--border);margin-bottom:2px;}
  .index-header h1{font-family:var(--font-mono);font-weight:400;font-size:.7rem;
                   letter-spacing:.22em;text-transform:uppercase;color:#666;}
  .film-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr));gap:2px;padding:2px;}
  .film-card{display:block;text-decoration:none;color:inherit;background:#0a0a0a;overflow:hidden;}
  .film-card__thumb{position:relative;aspect-ratio:2.35/1;overflow:hidden;background:#111;}
  .film-card__thumb img{width:100%;height:100%;object-fit:cover;display:block;
    transition:transform .6s ease,filter .4s ease;filter:grayscale(20%);}
  .film-card:hover .film-card__thumb img{transform:scale(1.04);filter:grayscale(0%);}
  .film-card__info{padding:1.1rem 1.2rem 1.3rem;border-top:1px solid #1a1a1a;}
  .film-card__artist{font-family:var(--font-mono);font-size:.6rem;letter-spacing:.14em;
                     text-transform:uppercase;color:#888;margin:0 0 .3rem;}
  .film-card__title{font-family:var(--font-body);font-weight:900;font-size:1.2rem;margin:0;
                    color:#e8e4de;letter-spacing:-.01em;line-height:1.15;}
  .film-card__date{font-family:var(--font-mono);font-size:.55rem;color:#555;margin:.3rem 0 0;}
  .meta-loading{opacity:.3;}
`;

// ─── JS ───────────────────────────────────────────────────────────────────────

const JS = `
  // ── YouTube IFrame API ───────────────────────────────────────────
  let _ytReady = false;
  const _ytQ = [];
  window.onYouTubeIframeAPIReady = () => { _ytReady=true; _ytQ.forEach(f=>f()); _ytQ.length=0; };
  function _whenYT(fn) { _ytReady ? fn() : _ytQ.push(fn); }

  // ── YouTube Data API v3 (proxied via Worker — key stays server-side) ──
  async function fetchYTData(ids) {
    const idList = Array.isArray(ids) ? ids.join(',') : ids;
    try {
      const r = await fetch('/api/yt?ids=' + encodeURIComponent(idList));
      if (!r.ok) return {};
      const data = await r.json();
      const out = {};
      (data.items || []).forEach(item => {
        const s = item.snippet || {};
        out[item.id] = {
          title:        s.title        || '',
          channelTitle: s.channelTitle || '',
          description:  s.description  || '',
          tags:        (s.tags         || []).slice(0, 12),
          publishedAt:  s.publishedAt  || '',
          duration:     (item.contentDetails || {}).duration || '',
        };
      });
      return out;
    } catch { return {}; }
  }

  // Parse ISO 8601 duration PT4M13S → "4:13"
  function parseDuration(iso) {
    if (!iso) return '';
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return '';
    const h = parseInt(m[1]||0), min = parseInt(m[2]||0), s = parseInt(m[3]||0);
    if (h) return h+':'+String(min).padStart(2,'0')+':'+String(s).padStart(2,'0');
    return min+':'+String(s).padStart(2,'0');
  }

  // Format ISO date → "March 12, 2024"
  function formatDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
    } catch { return ''; }
  }

  // Parse "Artist — Song Title (Official Video)" → { artist, songTitle }
  function parseArtistTitle(title, channel) {
    const m = title.match(/^(.+?)\s+[-\u2013\u2014]\s+(.+?)(?:\s*[\(\[].+)?$/);
    if (m) return { artist:m[1].trim(), songTitle:m[2].trim() };
    return { artist:channel, songTitle:title.replace(/\s*[\(\[](?:official|music|video|mv|lyric|audio).+/i,'').trim() };
  }

  // ── Time formatter ───────────────────────────────────────────────
  function _fmt(s) {
    if (!s||isNaN(s)) return '0:00';
    return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  }

  // ── Build animation ──────────────────────────────────────────────
  function triggerBuild() {
    const lines = document.querySelectorAll('.build-line');
    lines.forEach(el => { el.classList.remove('visible'); el.style.transitionDelay='0ms'; });
    requestAnimationFrame(() => requestAnimationFrame(() => {
      lines.forEach((el,i) => { el.style.transitionDelay=(i*52)+'ms'; el.classList.add('visible'); });
    }));
  }
  setTimeout(triggerBuild, 80);

  // ── Quality ──────────────────────────────────────────────────────
  const Q_LABELS = {
    hd2880:'5K', hd2160:'4K / UHD', hd1440:'2K / QHD',
    hd1080:'1080p HD', hd720:'720p HD',
    large:'480p', medium:'360p', small:'240p', tiny:'144p',
  };
  const Q_ORDER = ['hd2880','hd2160','hd1440','hd1080','hd720','large','medium','small','tiny'];

  // ── Custom Player ────────────────────────────────────────────────
  function launchPlayer(thumbEl) {
    const videoId = thumbEl.dataset.videoId;
    const wrap    = thumbEl.parentElement;

    const shell = document.createElement('div');
    shell.className = 'yt-player';
    shell.innerHTML =
      '<div id="ytp-'+videoId+'"></div>'+
      '<div class="yt-player__overlay"></div>'+
      '<div class="yt-controls">'+
        '<div class="yt-progress"><div class="yt-progress__fill"></div><div class="yt-progress__thumb"></div></div>'+
        '<div class="yt-ctrl-row">'+
          '<button class="yt-btn js-play" aria-label="Play/Pause">'+
            '<svg viewBox="0 0 24 24">'+
              '<path class="js-icon-pause" d="M6 4h4v16H6zM14 4h4v16h-4z"/>'+
              '<path class="js-icon-play" d="M8 5l13 7-13 7z" style="display:none"/>'+
            '</svg>'+
          '</button>'+
          '<span class="yt-time js-time">0:00 / 0:00</span>'+
          '<div class="yt-spacer"></div>'+
          '<div class="yt-vol-group">'+
            '<button class="yt-btn yt-btn--sm js-mute" aria-label="Mute">'+
              '<svg viewBox="0 0 24 24">'+
                '<path class="js-icon-vol" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>'+
                '<path class="js-icon-muted" style="display:none" d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>'+
              '</svg>'+
            '</button>'+
            '<div class="yt-vol-wrap"><input type="range" class="yt-volume js-volume" min="0" max="100" value="100"></div>'+
          '</div>'+
          '<div class="yt-quality-wrap">'+
            '<button class="yt-quality-btn js-q-btn">Auto</button>'+
            '<div class="yt-quality-menu js-q-menu"></div>'+
          '</div>'+
          '<button class="yt-btn yt-btn--sm js-fs" aria-label="Fullscreen">'+
            '<svg viewBox="0 0 24 24">'+
              '<path class="js-icon-fs" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>'+
              '<path class="js-icon-exit-fs" style="display:none" d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>'+
            '</svg>'+
          '</button>'+
        '</div>'+
      '</div>';

    wrap.replaceChild(shell, thumbEl);

    const fill     = shell.querySelector('.yt-progress__fill');
    const thumb    = shell.querySelector('.yt-progress__thumb');
    const timeEl   = shell.querySelector('.js-time');
    const playBtn  = shell.querySelector('.js-play');
    const iPause   = shell.querySelector('.js-icon-pause');
    const iPlay    = shell.querySelector('.js-icon-play');
    const muteBtn  = shell.querySelector('.js-mute');
    const iVol     = shell.querySelector('.js-icon-vol');
    const iMuted   = shell.querySelector('.js-icon-muted');
    const volInput = shell.querySelector('.js-volume');
    const qBtn     = shell.querySelector('.js-q-btn');
    const qMenu    = shell.querySelector('.js-q-menu');
    const fsBtn    = shell.querySelector('.js-fs');
    const iFs      = shell.querySelector('.js-icon-fs');
    const iExitFs  = shell.querySelector('.js-icon-exit-fs');
    const overlay  = shell.querySelector('.yt-player__overlay');
    const progress = shell.querySelector('.yt-progress');

    let player, ticker, dragging = false, currentQ = 'hd1080';

    function setPlay(p) { iPause.style.display=p?'':'none'; iPlay.style.display=p?'none':''; }
    function setMute(m) { iVol.style.display=m?'none':''; iMuted.style.display=m?'':'none'; }

    function tick() {
      if (!player||dragging) return;
      const cur=player.getCurrentTime()||0, dur=player.getDuration()||0;
      const pct = dur ? (cur/dur*100) : 0;
      fill.style.width  = pct+'%';
      thumb.style.left  = pct+'%';
      timeEl.textContent = _fmt(cur)+' / '+_fmt(dur);
    }

    function forceQuality(p) {
      const av = p.getAvailableQualityLevels();
      if (!av||!av.length) return;
      for (const q of Q_ORDER) {
        if (av.includes(q)) { p.setPlaybackQuality(q); currentQ=q; qBtn.textContent=Q_LABELS[q]||q; return; }
      }
    }

    function buildQualityMenu(p) {
      const av = p.getAvailableQualityLevels();
      if (!av||!av.length) { qBtn.style.display='none'; return; }
      qMenu.innerHTML = '';
      av.forEach(q => {
        if (!Q_LABELS[q]) return;
        const b = document.createElement('button');
        b.textContent = Q_LABELS[q]; b.dataset.q = q;
        if (q===currentQ) b.classList.add('active');
        b.addEventListener('click',()=>{
          p.setPlaybackQuality(q); currentQ=q; qBtn.textContent=Q_LABELS[q];
          qMenu.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x.dataset.q===q));
          qMenu.classList.remove('open');
        });
        qMenu.appendChild(b);
      });
    }

    _whenYT(() => {
      let qualityInitialized = false;

      function initQuality() {
        if (!player) return;
        const av = player.getAvailableQualityLevels();
        if (!av||av.length===0) { setTimeout(initQuality,500); return; }
        buildQualityMenu(player);
        if (!qualityInitialized) { forceQuality(player); qualityInitialized=true; }
      }

      player = new YT.Player('ytp-'+videoId, {
        videoId,
        playerVars:{ autoplay:1, controls:0, rel:0, playsinline:1,
                     iv_load_policy:3, disablekb:0, fs:0, cc_load_policy:0, vq:'hd2160' },
        events:{
          onReady(e) { e.target.playVideo(); ticker=setInterval(tick,250); },
          onStateChange(e) {
            setPlay(e.data===YT.PlayerState.PLAYING);
            if (e.data===YT.PlayerState.PLAYING) initQuality();
            if (e.data===YT.PlayerState.ENDED) { clearInterval(ticker); fill.style.width='100%'; }
          },
          onPlaybackQualityChange(e) {
            currentQ=e.data; qBtn.textContent=Q_LABELS[e.data]||e.data;
            qMenu.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.q===e.data));
          }
        }
      });
    });

    function togglePlay() { if(!player)return; player.getPlayerState()===YT.PlayerState.PLAYING?player.pauseVideo():player.playVideo(); }
    playBtn.addEventListener('click',togglePlay);
    overlay.addEventListener('click',togglePlay);

    function scrub(cx) {
      if(!player)return;
      const r=progress.getBoundingClientRect(), pct=Math.max(0,Math.min(1,(cx-r.left)/r.width));
      fill.style.width=(pct*100)+'%'; thumb.style.left=(pct*100)+'%';
      player.seekTo(player.getDuration()*pct,true);
    }
    progress.addEventListener('mousedown',e=>{dragging=true;scrub(e.clientX);});
    document.addEventListener('mousemove',e=>{if(dragging)scrub(e.clientX);});
    document.addEventListener('mouseup',e=>{if(dragging){scrub(e.clientX);dragging=false;}});
    progress.addEventListener('touchstart',e=>{dragging=true;scrub(e.touches[0].clientX);},{passive:true});
    document.addEventListener('touchmove',e=>{if(dragging)scrub(e.touches[0].clientX);},{passive:true});
    document.addEventListener('touchend',()=>{dragging=false;});

    muteBtn.addEventListener('click',()=>{
      if(!player)return;
      if(player.isMuted()){player.unMute();setMute(false);volInput.value=player.getVolume();}
      else{player.mute();setMute(true);volInput.value=0;}
    });
    volInput.addEventListener('input',()=>{
      if(!player)return;
      const v=parseInt(volInput.value,10);
      player.setVolume(v);
      if(v===0){player.mute();setMute(true);}else{player.unMute();setMute(false);}
    });
    qBtn.addEventListener('click',e=>{e.stopPropagation();qMenu.classList.toggle('open');});
    document.addEventListener('click',()=>qMenu.classList.remove('open'));
    fsBtn.addEventListener('click',()=>{
      if(!document.fullscreenElement){shell.requestFullscreen?.();iFs.style.display='none';iExitFs.style.display='';}
      else{document.exitFullscreen?.();iFs.style.display='';iExitFs.style.display='none';}
    });
    document.addEventListener('fullscreenchange',()=>{
      const f=!!document.fullscreenElement;iFs.style.display=f?'none':'';iExitFs.style.display=f?'':'none';
    });
  }
`;

// ─── Thumbnail HTML ───────────────────────────────────────────────────────────

function thumbHTML(youtubeId) {
  return `<div class="yt-thumb" data-video-id="${youtubeId}"
     onclick="launchPlayer(this)" role="button" tabindex="0" aria-label="Play video"
     onkeydown="if(event.key==='Enter'||event.key===' ')launchPlayer(this)">
  <img src="https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg"
       onerror="this.src='https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg'" alt="Video thumbnail"/>
  <button class="yt-thumb__btn" aria-hidden="true" tabindex="-1">
    <svg viewBox="0 0 68 48" xmlns="http://www.w3.org/2000/svg">
      <path class="yt-thumb__btn-bg"   d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C0 13.05 0 24 0 24s0 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C68 34.95 68 24 68 24s0-10.95-1.48-16.26z"/>
      <path class="yt-thumb__btn-icon" d="M45 24L27 14v20z"/>
    </svg>
  </button>
</div>`;
}

// ─── Video page ───────────────────────────────────────────────────────────────

function buildVideoPage(slug) {
  const video    = VIDEOS[slug];
  const idx      = VIDEO_SLUGS.indexOf(slug);
  const prevSlug = idx > 0 ? VIDEO_SLUGS[idx-1] : null;
  const nextSlug = idx < VIDEO_SLUGS.length-1 ? VIDEO_SLUGS[idx+1] : null;

  const ytId   = video.youtubeId;
  const title  = video.songTitle;
  const album  = video.album;

  const credits = video.credits.map(function(c) {
    return '<div class="credit-line build-line"><span class="credit-role">' + c.role + '</span><span class="credit-name">' + c.name + '</span></div>';
  }).join('');

  const prev = prevSlug
    ? '<a class="video-nav__link build-line" href="/work/' + prevSlug + '">&#8592; Previous</a>'
    : '<span></span>';
  const next = nextSlug
    ? '<a class="video-nav__link build-line" href="/work/' + nextSlug + '">Next &#8594;</a>'
    : '<span></span>';

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'MusicVideoObject',
    'name': title,
    'byArtist': { '@type': 'MusicGroup', 'name': 'Nu Vision' },
    'inAlbum':  { '@type': 'MusicAlbum', 'name': album },
    'productionCompany': { '@type': 'Organization', 'name': 'SCALE Films' },
    'director': { '@type': 'Person', 'name': 'Todd Sines' },
    'thumbnailUrl': 'https://i.ytimg.com/vi/' + ytId + '/maxresdefault.jpg',
    'embedUrl':     'https://www.youtube.com/embed/' + ytId,
  });

  return '<!DOCTYPE html>\n'
    + '<html lang="en">\n'
    + '<head>\n'
    + '  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>\n'
    + '  <title>' + title + ' \u2014 Nu Vision \u2014 SCALE Films</title>\n'
    + '  <meta name="description" content="Official music video for &apos;' + title + '&apos; by Nu Vision from the album ' + album + '. Directed by Todd Sines. A SCALE Films production."/>\n'
    + '  <meta name="keywords" id="seo-keywords" content="Nu Vision, ' + title + ', ' + album + ', music video, SCALE Films, Todd Sines, Nation Records"/>\n'
    + '  <meta property="og:title"       content="' + title + ' \u2014 Nu Vision"/>\n'
    + '  <meta property="og:description" content="Official music video directed by Todd Sines. From the album ' + album + ' on Nation Records."/>\n'
    + '  <meta property="og:image"       content="https://i.ytimg.com/vi/' + ytId + '/maxresdefault.jpg"/>\n'
    + '  <meta property="og:type"        content="video.other"/>\n'
    + '  <meta property="og:url"         content="https://scalefilms.com/work/' + video.slug + '"/>\n'
    + '  <meta name="twitter:card"       content="summary_large_image"/>\n'
    + '  <meta name="twitter:title"      content="' + title + ' \u2014 Nu Vision"/>\n'
    + '  <meta name="twitter:image"      content="https://i.ytimg.com/vi/' + ytId + '/maxresdefault.jpg"/>\n'
    + '  <script type="application/ld+json">' + jsonLd + '<\/script>\n'
    + '  <style>' + CSS + '<\/style>\n'
    + '</head>\n'
    + '<body>\n'
    + '  <header class="site-header">\n'
    + '    <a class="logo" href="/work">SCALE</a>\n'
    + '    <nav class="header-nav"><a href="/work">Work</a><a href="mailto:hello@scalefilms.com">Contact</a></nav>\n'
    + '  </header>\n'
    + '  <main class="video-page">\n'
    + '    <div class="video-wrap build-line">' + thumbHTML(ytId) + '</div>\n'
    + '    <section class="video-meta">\n'
    + '      <div class="meta-left">\n'
    + '        <h1 class="video-title build-line">' + title + '</h1>\n'
    + '        <p  class="video-artist build-line">Nu Vision</p>\n'
    + '        <p  class="video-date build-line meta-loading" id="vd">\u2014</p>\n'
    + '        <p  class="video-description build-line meta-loading" id="vdesc"></p>\n'
    + '      </div>\n'
    + '      <div class="meta-right"><div class="credits-block">' + credits + '</div></div>\n'
    + '    </section>\n'
    + '    <nav class="video-nav">' + prev + '<a class="video-nav__index build-line" href="/work">All Films</a>' + next + '</nav>\n'
    + '  </main>\n'
    + '  <footer class="site-footer">\n'
    + '    <span>&copy; 2026 SCALE Films</span>\n'
    + '    <a href="mailto:hello@scalefilms.com">hello@scalefilms.com</a>\n'
    + '  </footer>\n'
    + '  <script src="https://www.youtube.com/iframe_api"><\/script>\n'
    + '  <script>\n'
    + JS + '\n'
    + "  fetchYTData('" + ytId + "').then(function(data) {\n"
    + "    var d = data['" + ytId + "'];\n"
    + "    if (!d) return;\n"
    + "    var vd    = document.getElementById('vd');\n"
    + "    var vdesc = document.getElementById('vdesc');\n"
    + "    if (vd && d.publishedAt) { vd.textContent = formatDate(d.publishedAt); vd.classList.remove('meta-loading'); }\n"
    + "    if (vdesc && d.description) { vdesc.textContent = d.description; vdesc.classList.remove('meta-loading'); }\n"
    + "    if (d.tags && d.tags.length) {\n"
    + "      var kw = document.querySelector('meta[name=\'keywords\']');\n"
    + "      if (kw) kw.content = kw.content + ', ' + d.tags.join(', ');\n"
    + "      try {\n"
    + "        var ld = document.querySelector('script[type=\'application/ld+json\']');\n"
    + "        if (ld) { var obj = JSON.parse(ld.textContent); obj.keywords = d.tags; ld.textContent = JSON.stringify(obj); }\n"
    + "      } catch(e) {}\n"
    + "    }\n"
    + "  });\n"
    + '  <\/script>\n'
    + '</body>\n'
    + '</html>';
}

// ─── Index page ───────────────────────────────────────────────────────────────

function buildIndexPage() {
  var cards = VIDEO_SLUGS.map(function(slug, i) {
    var v = VIDEOS[slug];
    return '<a class="film-card build-line" href="/work/' + slug + '">'
      + '<div class="film-card__thumb">'
      + '<img src="https://i.ytimg.com/vi/' + v.youtubeId + '/maxresdefault.jpg"'
      + ' data-fallback="https://i.ytimg.com/vi/' + v.youtubeId + '/hqdefault.jpg"'
      + ' onerror="this.src=this.dataset.fallback;this.onerror=null"'
      + ' alt="' + v.songTitle + ' \u2014 Nu Vision" loading="lazy"/>'
      + '</div>'
      + '<div class="film-card__info">'
      + '<p class="film-card__artist">Nu Vision</p>'
      + '<p class="film-card__title">' + v.songTitle + '</p>'
      + '<p class="film-card__date meta-loading" data-cd="' + i + '"></p>'
      + '</div>'
      + '</a>';
  }).join('');

  var ids = VIDEO_SLUGS.map(function(s) { return VIDEOS[s].youtubeId; }).join(',');

  return '<!DOCTYPE html>'
    + '<html lang="en">'
    + '<head>'
    + '<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>'
    + '<title>Music Videos \u2014 Nu Vision \u2014 SCALE Films</title>'
    + '<meta name="description" content="Official music videos by Nu Vision from the album The Seed. Directed by Todd Sines. A SCALE Films production on Nation Records."/>'
    + '<meta name="keywords" content="Nu Vision, The Seed, music videos, SCALE Films, Todd Sines, Nation Records, acid house, electronic, post punk, Chicago"/>'
    + '<meta property="og:title" content="Nu Vision \u2014 Music Videos \u2014 SCALE Films"/>'
    + '<meta property="og:description" content="Official music videos directed by Todd Sines."/>'
    + '<meta property="og:image" content="https://i.ytimg.com/vi/QkSGDIKiUBE/maxresdefault.jpg"/>'
    + '<style>' + CSS + '</style>'
    + '</head>'
    + '<body>'
    + '<header class="site-header">'
    + '<a class="logo" href="/work">SCALE</a>'
    + '<nav class="header-nav"><a href="/work">Work</a><a href="mailto:hello@scalefilms.com">Contact</a></nav>'
    + '</header>'
    + '<div class="index-header"><h1 class="build-line">Music Videos</h1></div>'
    + '<div class="film-grid">' + cards + '</div>'
    + '<footer class="site-footer">'
    + '<span>&copy; 2026 SCALE Films</span>'
    + '<a href="mailto:hello@scalefilms.com">hello@scalefilms.com</a>'
    + '</footer>'
    + '<script>' + JS
    + 'fetchYTData(\'' + ids + '\').then(function(data){'
    + '  VIDEO_SLUGS.forEach(function(slug,i){'
    + '    var v=VIDEOS[slug];'
    + '    var d=data[v.youtubeId];'
    + '    if(!d)return;'
    + '    var cd=document.querySelector(\'[data-cd="\'+i+\'"]\');'
    + '    if(cd&&d.publishedAt){cd.textContent=formatDate(d.publishedAt);cd.classList.remove(\'meta-loading\');}'
    + '  });'
    + '});'
    + '</script>'
    + '</body>'
    + '</html>';
}

// ─── 404 ──────────────────────────────────────────────────────────────────────

function build404() {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>'
    + '<title>Not Found — SCALE Films</title>'
    + '<style>body{background:#080808;color:#6a6560;font-family:"Helvetica Neue",sans-serif;'
    + 'display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}'
    + '.w{text-align:center;}h1{color:#e0dbd4;font-size:14px;font-weight:700;letter-spacing:.2em;'
    + 'text-transform:uppercase;margin-bottom:16px;}'
    + 'a{color:#6a6560;font-size:11px;letter-spacing:.14em;text-transform:uppercase;}'
    + 'a:hover{color:#e0dbd4;}</style>'
    + '</head><body><div class="w"><h1>Page Not Found</h1>'
    + '<a href="/work">&#8592; Return to SCALE Films</a></div></body></html>';
}


// ─── Router ───────────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname.replace(/\/$/, '') || '/';
    const hdrs = {
      'Content-Type':          'text/html;charset=UTF-8',
      'Cache-Control':         'public,max-age=600',
      'X-Content-Type-Options':'nosniff',
      'Referrer-Policy':       'strict-origin-when-cross-origin',
    };

    // ── API proxy: YouTube Data API (keeps key server-side) ──
    if (path === '/api/yt') {
      const ids = url.searchParams.get('ids');
      if (!ids) return new Response('{"error":"missing ids"}', { status:400, headers:{'Content-Type':'application/json'} });
      const apiKey = env.YT_API_KEY || '';
      if (!apiKey) return new Response('{"error":"API key not configured"}', { status:500, headers:{'Content-Type':'application/json'} });
      const ytUrl = 'https://www.googleapis.com/youtube/v3/videos?id=' + encodeURIComponent(ids) + '&part=snippet,contentDetails&key=' + apiKey;
      try {
        const ytRes = await fetch(ytUrl);
        const body  = await ytRes.text();
        return new Response(body, {
          status: ytRes.status,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public,max-age=3600',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (e) {
        return new Response('{"error":"upstream failure"}', { status:502, headers:{'Content-Type':'application/json'} });
      }
    }

    if (path === '/work' || path === '') {
      return new Response(buildIndexPage(), { headers: hdrs });
    }
    const m = path.match(/^\/work\/([^/]+)$/);
    if (m && VIDEOS[m[1]]) {
      return new Response(buildVideoPage(m[1]), { headers: hdrs });
    }
    return new Response(build404(), { status:404, headers:{'Content-Type':'text/html;charset=UTF-8'} });
  },
};
