/**
 * Kaali Widget — v1.0.0
 * Embed: <script src="https://kaali.absoluteapplabs.com/widget.js?id=TENANT_ID" async></script>
 * Powered by Absolute App Labs
 */
;(function () {
  'use strict'

  // ── Extract tenant ID from script tag ────────────────────
  const scriptEl   = document.currentScript ||
    Array.from(document.querySelectorAll('script[src*="widget.js"]')).pop()
  const scriptSrc  = scriptEl ? scriptEl.getAttribute('src') : ''
  const tenantId   = new URL(scriptSrc, location.href).searchParams.get('id')

  if (!tenantId) {
    console.warn('[Kaali] No tenant ID found. Add ?id=YOUR_TENANT_ID to the script src.')
    return
  }

  // ── Determine API base URL from script origin ─────────────
  const scriptUrl  = new URL(scriptSrc, location.href)
  const API_BASE   = scriptUrl.origin

  // ── State ─────────────────────────────────────────────────
  let config       = null
  let isOpen       = false
  let isStarted    = false
  let isBusy       = false
  let history      = []          // { role, content }[]
  let sessionMsgs  = []          // { role, content, time }[]
  let visitorType  = null
  let convId       = null
  let leadSaved    = false
  let calShown     = false
  let badgeShown   = false
  let pagesVisited = [location.pathname]
  let sessionCount = parseInt(localStorage.getItem('__kaali_sessions__') || '0') + 1
  localStorage.setItem('__kaali_sessions__', sessionCount)

  // ── CSS ───────────────────────────────────────────────────
  const CSS = `
    #kaali-bubble {
      position: fixed; bottom: 26px; right: 26px;
      width: 56px; height: 56px;
      background: linear-gradient(145deg, #1D4FD8, #4F8EF7); /* updated by applyConfig */
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; z-index: 2147483640;
      box-shadow: 0 4px 22px rgba(30,79,216,.55);
      transition: transform .2s, box-shadow .2s;
      animation: kaali-breathe 3.5s ease-in-out infinite;
      border: none; outline: none;
    }
    #kaali-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 28px rgba(30,79,216,.72);
      animation: none;
    }
    #kaali-bubble svg { width: 22px; height: 22px; fill: #fff; pointer-events: none; }
    #kaali-bubble .kaali-badge {
      position: absolute; top: -1px; right: -1px;
      width: 16px; height: 16px;
      background: #EF4444; border: 2.5px solid #fff;
      border-radius: 50%; font-size: 9px; color: #fff;
      display: none; align-items: center; justify-content: center;
      font-weight: 700; font-family: sans-serif;
    }
    @keyframes kaali-breathe {
      0%,100% { box-shadow: 0 4px 20px rgba(30,79,216,.5); }
      50%      { box-shadow: 0 4px 26px rgba(30,79,216,.68), 0 0 0 8px rgba(30,79,216,.07); }
    }
    #kaali-panel {
      position: fixed; bottom: 94px; right: 26px;
      width: 376px; height: 580px;
      background: #0C1220;
      border: 0.5px solid rgba(79,142,247,.2);
      border-radius: 18px;
      display: flex; flex-direction: column;
      z-index: 2147483639;
      box-shadow: 0 24px 80px rgba(0,0,0,.75);
      overflow: hidden; font-family: 'DM Sans', system-ui, sans-serif;
      transform: scale(.94) translateY(12px);
      transform-origin: bottom right;
      opacity: 0; pointer-events: none;
      transition: transform .28s cubic-bezier(.34,1.56,.64,1), opacity .2s;
    }
    #kaali-panel.kaali-open {
      transform: scale(1) translateY(0);
      opacity: 1; pointer-events: all;
    }
    .kaali-hdr {
      display: flex; align-items: center; gap: 11px;
      padding: 14px 15px;
      background: #111A2E;
      border-bottom: 0.5px solid rgba(255,255,255,.07);
      flex-shrink: 0;
    }
    .kaali-av {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(145deg,#1D4FD8,#4F8EF7);
      display: flex; align-items: center; justify-content: center;
      position: relative; flex-shrink: 0; font-size: 0;
    }
    .kaali-av-l {
      font-size: 14px; font-weight: 700; color: #fff;
      font-family: 'Syne', system-ui, sans-serif;
    }
    .kaali-av-dot {
      position: absolute; bottom: 1px; right: 1px;
      width: 9px; height: 9px; background: #22D17A;
      border: 2px solid #111A2E; border-radius: 50%;
    }
    .kaali-nm { font-size: 14px; font-weight: 600; color: #E5EBF8; line-height: 1; margin-bottom: 2px; }
    .kaali-st { font-size: 10.5px; color: #22D17A; display: flex; align-items: center; gap: 4px; }
    .kaali-st::before { content:''; width:5px; height:5px; background:#22D17A; border-radius:50%; }
    .kaali-x {
      width: 28px; height: 28px; border-radius: 7px;
      background: none; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #6E7E9E; margin-left: auto;
      transition: background .15s, color .15s;
    }
    .kaali-x:hover { background: #172038; color: #E5EBF8; }
    .kaali-msgs {
      flex: 1; overflow-y: auto; padding: 13px 12px;
      display: flex; flex-direction: column; gap: 9px;
      scroll-behavior: smooth;
    }
    .kaali-msgs::-webkit-scrollbar { width: 3px; }
    .kaali-msgs::-webkit-scrollbar-thumb { background: #172038; border-radius: 2px; }
    .kaali-msg {
      display: flex; flex-direction: column; max-width: 85%;
      animation: kaali-up .22s ease forwards; opacity: 0;
    }
    @keyframes kaali-up { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
    .kaali-msg.bot { align-self: flex-start; }
    .kaali-msg.usr { align-self: flex-end; }
    .kaali-bbl {
      padding: 9px 12px; border-radius: 13px;
      font-size: 13.5px; line-height: 1.55; word-break: break-word;
    }
    .kaali-msg.bot .kaali-bbl {
      background: #111A2E; color: #E5EBF8;
      border: 0.5px solid rgba(255,255,255,.07);
      border-bottom-left-radius: 4px;
    }
    .kaali-msg.usr .kaali-bbl {
      background: #1B3FA0; color: #DDE9FF;
      border-bottom-right-radius: 4px;
    }
    .kaali-ts { font-size: 10px; color: #6E7E9E; margin-top: 3px; padding: 0 3px; }
    .kaali-msg.usr .kaali-ts { align-self: flex-end; }
    .kaali-vbtns { display: flex; flex-direction: column; gap: 6px; margin-top: 2px; width: 244px; }
    .kaali-vbtn {
      display: flex; align-items: center; gap: 9px;
      padding: 9px 12px; border-radius: 9px;
      background: #172038; border: 0.5px solid rgba(255,255,255,.13);
      font-size: 12.5px; color: #E5EBF8; text-align: left;
      width: 100%; cursor: pointer;
      transition: background .15s, border-color .15s; font-family: inherit;
    }
    .kaali-vbtn:hover { background: rgba(79,142,247,.12); border-color: rgba(79,142,247,.38); }
    .kaali-typing {
      display: flex; align-items: center; gap: 4px;
      padding: 9px 12px;
      background: #111A2E; border: 0.5px solid rgba(255,255,255,.07);
      border-radius: 13px; border-bottom-left-radius: 4px;
      align-self: flex-start; width: fit-content;
    }
    .kaali-typing span {
      width: 6px; height: 6px; background: #6E7E9E;
      border-radius: 50%; display: block;
      animation: kaali-tdot 1.4s ease-in-out infinite;
    }
    .kaali-typing span:nth-child(2) { animation-delay: .2s; }
    .kaali-typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes kaali-tdot {
      0%,60%,100% { transform:translateY(0); opacity:.4; }
      30%          { transform:translateY(-5px); opacity:1; }
    }
    .kaali-cal-btn {
      display: flex; align-items: center; gap: 9px;
      padding: 9px 12px;
      background: rgba(34,209,122,.07);
      border: 0.5px solid rgba(34,209,122,.22);
      border-radius: 9px; font-size: 12.5px;
      color: #22D17A; font-weight: 500; cursor: pointer;
      align-self: flex-start; text-decoration: none;
      transition: background .15s;
      animation: kaali-up .22s ease forwards; opacity: 0;
    }
    .kaali-cal-btn:hover { background: rgba(34,209,122,.13); }
    .kaali-ok-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 500; color: #22D17A;
      background: rgba(34,209,122,.1);
      border: 0.5px solid rgba(34,209,122,.25);
      padding: 4px 10px; border-radius: 20px;
      align-self: flex-start;
      animation: kaali-up .22s ease forwards; opacity: 0;
    }
    .kaali-ftr {
      padding: 10px 11px;
      border-top: 0.5px solid rgba(255,255,255,.07);
      background: #0C1220; flex-shrink: 0;
    }
    .kaali-irow { display: flex; gap: 7px; align-items: flex-end; }
    .kaali-inp {
      flex: 1; background: #111A2E;
      border: 0.5px solid rgba(255,255,255,.13);
      border-radius: 11px; padding: 9px 12px;
      font-size: 13px; color: #E5EBF8;
      outline: none; resize: none;
      min-height: 40px; max-height: 94px;
      line-height: 1.44; font-family: inherit;
      transition: border-color .15s;
    }
    .kaali-inp:focus { border-color: rgba(79,142,247,.45); }
    .kaali-inp::placeholder { color: #3A4A6A; }
    .kaali-snd {
      width: 40px; height: 40px; background: #4F8EF7;
      border: none; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; cursor: pointer;
      transition: background .15s, transform .1s;
    }
    .kaali-snd:hover { background: #3B7BF5; }
    .kaali-snd:active { transform: scale(.94); }
    .kaali-snd:disabled { background: #172038; cursor: default; }
    .kaali-snd svg { width: 15px; height: 15px; fill: #fff; }
    .kaali-byline {
      text-align: center; font-size: 10px;
      color: #3A4A6A; margin-top: 6px;
    }
    .kaali-byline a { color: #3A4A6A; text-decoration: none; }
    @media (max-width: 480px) {
      #kaali-panel {
        width: calc(100vw - 16px) !important;
        right: 8px !important; bottom: 82px !important;
        height: 74vh !important;
      }
    }
  `

  // ── Inject styles ─────────────────────────────────────────
  function injectStyles() {
    const style = document.createElement('style')
    style.id    = 'kaali-styles'
    style.textContent = CSS
    document.head.appendChild(style)
  }

  // ── Build widget DOM ──────────────────────────────────────
  function buildDOM(cfg) {
    const nm    = cfg.botName || 'Kaali'
    const letter = nm.charAt(0).toUpperCase()

    // Bubble
    const bubble = document.createElement('div')
    bubble.id    = 'kaali-bubble'
    bubble.setAttribute('role', 'button')
    bubble.setAttribute('aria-label', `Chat with ${nm}`)
    bubble.innerHTML = `
      <div class="kaali-badge" id="kaali-badge"></div>
      <svg viewBox="0 0 24 24" id="kaali-ico-chat"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      <svg viewBox="0 0 24 24" id="kaali-ico-close" style="display:none"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    `

    // Panel
    const panel = document.createElement('div')
    panel.id    = 'kaali-panel'
    panel.setAttribute('role', 'dialog')
    panel.setAttribute('aria-label', `Chat with ${nm}`)
    panel.innerHTML = `
      <div class="kaali-hdr">
        <div class="kaali-av">
          <span class="kaali-av-l">${letter}</span>
          <div class="kaali-av-dot"></div>
        </div>
        <div style="flex:1">
          <div class="kaali-nm" id="kaali-bot-nm">${nm}</div>
          <div class="kaali-st">Online</div>
        </div>
        <button class="kaali-x" id="kaali-close" aria-label="Close chat">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="kaali-msgs" id="kaali-msgs"></div>
      <div class="kaali-ftr">
        <div class="kaali-irow">
          <textarea id="kaali-inp" class="kaali-inp"
            placeholder="Type a message…" rows="1"
            aria-label="Your message"></textarea>
          <button class="kaali-snd" id="kaali-snd" aria-label="Send">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
        <div class="kaali-byline">
          Powered by <a href="https://absoluteapplabs.com" target="_blank" rel="noopener">Absolute App Labs</a>
        </div>
      </div>
    `

    document.body.appendChild(bubble)
    document.body.appendChild(panel)

    // Wire events
    bubble.addEventListener('click', togglePanel)
    document.getElementById('kaali-close').addEventListener('click', closePanel)
    document.getElementById('kaali-snd').addEventListener('click', sendMsg)
    document.getElementById('kaali-inp').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() }
    })
    document.getElementById('kaali-inp').addEventListener('input', function () {
      this.style.height = 'auto'
      this.style.height = Math.min(this.scrollHeight, 94) + 'px'
    })
  }

  // Track page navigation
  window.addEventListener('popstate', () => {
    if (!pagesVisited.includes(location.pathname)) pagesVisited.push(location.pathname)
  })

  // ── Panel open/close ──────────────────────────────────────
  function togglePanel()  { isOpen ? closePanel() : openPanel() }
  function openPanel()  {
    isOpen = true
    document.getElementById('kaali-panel').classList.add('kaali-open')
    document.getElementById('kaali-ico-chat').style.display  = 'none'
    document.getElementById('kaali-ico-close').style.display = 'block'
    document.getElementById('kaali-badge').style.display     = 'none'
    if (!isStarted) { isStarted = true; setTimeout(showWelcome, 220) }
    setTimeout(() => document.getElementById('kaali-inp')?.focus(), 300)
  }
  function closePanel() {
    isOpen = false
    document.getElementById('kaali-panel').classList.remove('kaali-open')
    document.getElementById('kaali-ico-chat').style.display  = 'block'
    document.getElementById('kaali-ico-close').style.display = 'none'
  }

  // ── Message rendering ─────────────────────────────────────
  function fmtTime() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  function scrollDown() {
    const el = document.getElementById('kaali-msgs')
    if (el) setTimeout(() => el.scrollTop = el.scrollHeight, 60)
  }
  function addMsg(role, html) {
    const wrap = document.createElement('div')
    wrap.className = `kaali-msg ${role}`
    const bbl = document.createElement('div')
    bbl.className = 'kaali-bbl'
    if (role === 'bot') bbl.innerHTML = html.replace(/\n/g, '<br>')
    else bbl.textContent = html
    const ts = document.createElement('div')
    ts.className = 'kaali-ts'; ts.textContent = fmtTime()
    wrap.appendChild(bbl); wrap.appendChild(ts)
    document.getElementById('kaali-msgs').appendChild(wrap)
    sessionMsgs.push({ role: role === 'bot' ? 'assistant' : 'user', content: html, time: fmtTime() })
    scrollDown()
  }
  function showTyping() {
    const d = document.createElement('div')
    d.className = 'kaali-typing'; d.id = 'kaali-typing'
    d.innerHTML = '<span></span><span></span><span></span>'
    document.getElementById('kaali-msgs').appendChild(d); scrollDown()
  }
  function hideTyping() {
    const d = document.getElementById('kaali-typing'); if (d) d.remove()
  }
  function showCalBtn() {
    if (calShown || !config?.calendly) return; calShown = true
    const a = document.createElement('a')
    a.className = 'kaali-cal-btn'
    a.href = config.calendly; a.target = '_blank'; a.rel = 'noopener'
    a.innerHTML = '<span>📅</span><span>Book a discovery call →</span>'
    document.getElementById('kaali-msgs').appendChild(a); scrollDown()
  }
  function showLeadOK() {
    if (leadSaved) return; leadSaved = true
    const d = document.createElement('div')
    d.className = 'kaali-ok-badge'
    d.textContent = '✓ Contact noted — team will be in touch'
    document.getElementById('kaali-msgs').appendChild(d); scrollDown()
  }

  // ── Welcome message ───────────────────────────────────────
  function showWelcome() {
    const nm  = config?.botName || 'Kaali'
    const co  = config?.company || 'us'
    addMsg('bot', `Hi! 👋 I'm <strong>${nm}</strong>, your guide to ${co}. What brings you here today?`)
    setTimeout(() => {
      const wrap = document.createElement('div')
      wrap.className = 'kaali-msg bot'; wrap.style.maxWidth = '100%'
      const inner = document.createElement('div')
      inner.className = 'kaali-vbtns'
      ;[
        { em: '🚀', label: 'I am looking to build a product', type: 'CLIENT'   },
        { em: '🤝', label: 'I am your existing client',       type: 'EXISTING' },
        { em: '📈', label: 'I am an investor',                type: 'INVESTOR' },
        { em: '💬', label: 'Just exploring',                  type: 'GENERAL'  },
      ].forEach(o => {
        const btn = document.createElement('button')
        btn.className = 'kaali-vbtn'
        btn.innerHTML = `<span style="font-size:13px;width:18px;text-align:center">${o.em}</span>${o.label}`
        btn.onclick = () => {
          visitorType = o.type; wrap.remove()
          addMsg('usr', o.label)
          history.push({ role: 'user', content: `[Visitor selected: ${o.type}] ${o.label}` })
          callAPI()
        }
        inner.appendChild(btn)
      })
      wrap.appendChild(inner)
      document.getElementById('kaali-msgs').appendChild(wrap); scrollDown()
    }, 420)
  }

  // ── Send user message ─────────────────────────────────────
  function sendMsg() {
    const inp = document.getElementById('kaali-inp')
    const txt = inp.value.trim()
    if (!txt || isBusy) return
    inp.value = ''; inp.style.height = 'auto'
    addMsg('usr', txt)
    history.push({ role: 'user', content: txt })
    callAPI()
  }

  // ── Call API ──────────────────────────────────────────────
  async function callAPI() {
    if (isBusy) return
    isBusy = true
    document.getElementById('kaali-snd').disabled = true
    showTyping()

    try {
      const res = await fetch(config.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorData: {
            country:      Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone?.split('/')[0] || '',
            device:       /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            pagesVisited: pagesVisited,
            sessionCount: sessionCount,
            ip:           '',
          },
          tenantId:       tenantId,
          conversationId: convId,
          messages:       history,
          visitorType:    visitorType || 'GENERAL',
          pageUrl:        location.href,
        }),
      })

      const data = await res.json()
      hideTyping()

      if (!data.text) throw new Error(data.error || 'Empty response')

      // Persist conversation ID
      if (data.conversationId && !convId) convId = data.conversationId

      // Lead captured
      if (data.leadCaptured) showLeadOK()

      // Calendly CTA
      const lc = data.text.toLowerCase()
      if (!calShown && config?.calendly &&
          (lc.includes('book a call') || lc.includes('discovery call'))) {
        setTimeout(showCalBtn, 300)
      }

      history.push({ role: 'assistant', content: data.text })
      addMsg('bot', data.text)

    } catch (err) {
      hideTyping()
      addMsg('bot', "I'm having a small issue right now. Please try again in a moment.")
      console.error('[Kaali]', err)
    }

    isBusy = false
    document.getElementById('kaali-snd').disabled = false
  }

  // ── Load config and boot ──────────────────────────────────
  async function boot() {
    try {
      const res  = await fetch(`${API_BASE}/api/widget-config/${tenantId}`)
      if (!res.ok) throw new Error('Config not found')
      config = await res.json()
    } catch (e) {
      console.warn('[Kaali] Could not load widget config:', e.message)
      // Use minimal fallback so widget still appears
      config = {
        tenantId, botName: 'Kaali', company: 'us',
        apiUrl: `${API_BASE}/api/chat`,
        calendly: '', limited: false,
      }
    }

    injectStyles()
    buildDOM(config)

    // Show unread badge after 15s
    setTimeout(() => {
      if (!isOpen) {
        const b = document.getElementById('kaali-badge')
        if (b) { b.style.display = 'flex'; b.textContent = '1' }
      }
    }, 15000)
  }

  // ── Boot when DOM is ready ────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }
})()
