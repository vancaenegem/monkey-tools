class TamperWindow extends HTMLElement {
  constructor(width = 300, height = 200) {
      super();
      this._shadow = this.attachShadow({ mode: 'open' });
      this._dragging = false;
      this._ox = 0;
      this._oy = 0;
      this._width = width;
      this._height = 200;
      this._content = height;
  }

 connectedCallback() {
     this._shadow.innerHTML = `
        <style>
          :host {
            display: flex;
            flex-direction: column;
            opacity: 0.7; /* 0 = invisible, 1 = opaque */
            
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            position: fixed;
            top: 50px;
            left: 50px;
            z-index:99999;
        }
        :host(.collapsed) {
          height: auto !important;
        }
        :host(.collapsed) .resizer { display: none; }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #2c3e50;
          color: white;
          padding: 8px 12px;
          cursor: move;
          border-radius: 8px 8px 0 0;
        }
        .header-buttons {
          display: flex;
          gap: 6px;
        }
        .btn {
          background: rgba(255,255,255,0.15);
          border: none;
          color: white;
          cursor: pointer;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .btn:hover { background: rgba(255,255,255,0.3); }
        .content {
            margin: 12px;
            overflow: auto;
            flex: 1;          /* ← prend TOUT l'espace restant après le header */
            min-height: 0;    /* ← nécessaire pour que overflow: auto fonctionne */
        }
        .hidden {
          display: none;
        }
        
        /* Poignée bas-droite */
        .resizer {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 14px;
          height: 14px;
          cursor: nwse-resize;
          opacity: 0.4;
          transition: opacity 0.2s;
          /* Indicateur visuel : 3 lignes diagonales */
          background-image:
          linear-gradient(135deg,
            transparent 30%, #666 30%, #666 40%, transparent 40%,
            transparent 55%, #666 55%, #666 65%, transparent 65%,
            transparent 80%, #666 80%, #666 90%, transparent 90%
          );
        }
        .resizer:hover { opacity: 1; }
      </style>
      <div class="header">
        <span>TamperWindow</span>
        <div class="header-buttons">
          <button class="btn" id="toggle" title="Afficher/Masquer">▼</button>
          <button class="btn" id="close" title="Fermer">✕</button>
        </div>
      </div>
      <div class="content"></div>
      <div class="resizer" id="resizer"></div>
    `;
     this._content = this._shadow.querySelector ('.content');
     this._bindButtons();
     this._bindResize();

     this.style.width = this._width +'px';
     this.style.height = this._height +'px';
     this._bindDrag();
  }

  disconnectedCallback() {
    //console.log("Custom element removed from page.");
  }

  connectedMoveCallback() {
    //console.log("Custom element moved with moveBefore()");
  }

  adoptedCallback() {
    //console.log("Custom element moved to new page.");
  }

  attributeChangedCallback(name, oldValue, newValue) {
      //console.log(`Attribute ${name} has changed.`);
  }


  _bindButtons() {
      const toggle = this._shadow.getElementById('toggle');
      const content = this._shadow.getElementById('content');
      const close = this._shadow.getElementById('close');

      toggle.addEventListener('click', () => {
          const isHidden = this._content.classList.toggle('hidden');
          this.classList.toggle('collapsed', isHidden);
          toggle.textContent = isHidden ? '▶' : '▼';
          toggle.title = isHidden ? 'Afficher' : 'Masquer';
      });

      close.addEventListener('click', () => this.remove());
  }


  _bindResize() {
      const MIN_W = 150, MIN_H = 80;
      let resizing = false, startX, startY, startW, startH;

      this._shadow.getElementById('resizer').addEventListener('mousedown', e => {
          resizing = true;
          startX   = e.clientX;
          startY   = e.clientY;
          startW   = this.offsetWidth;
          startH   = this.offsetHeight;
          e.preventDefault();
          e.stopPropagation();
      });
      document.addEventListener('mousemove', e => {
          if (!resizing) return;
          const w = Math.max(MIN_W, startW + (e.clientX - startX));
          const h = Math.max(MIN_H, startH + (e.clientY - startY));
          this.style.width  = w + 'px';
          this.style.height = h + 'px';
          this._height = h; this._width = w;
      });
      document.addEventListener('mouseup', () => { resizing = false; });
}

_bindDrag() {
    const header = this._shadow.querySelector('.header');
    header.addEventListener('mousedown', e => {
        this._dragging = true;
        const r = this.getBoundingClientRect();
        this._ox = e.clientX - r.left;
        this._oy = e.clientY - r.top;
        e.preventDefault();
    });

    // Listen on document to catch fast mouse moves
    document.addEventListener('mousemove', e => {
        if (!this._dragging) return;
        let x = e.clientX - this._ox;
        let y = e.clientY - this._oy;

        // Keep inside viewport
        x = Math.max(0, Math.min(x, window.innerWidth - this.offsetWidth));
        y = Math.max(0, Math.min(y, window.innerHeight - this.offsetHeight));

        this.style.left = x + 'px';
        this.style.top = y + 'px';
    });

    document.addEventListener('mouseup', () => {
        this._dragging = false;
    });
  }

  
  log(...args) {
        const now = new Date().toLocaleTimeString();
        const htmlContent = args
            .map(arg => {
                if (typeof arg === 'string') return arg;
                if (arg instanceof Error) return arg.message;
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return String(arg);
                }
            })
            .join(' ');
    
        this._content.insertAdjacentHTML('beforeend',
                                         `<div style="display:flex;gap:8px;margin-bottom:2px">
                                            <span style="opacity:.6;font-size:.85em;white-space:nowrap;flex-shrink:0">[${now}]</span>
                                            <span style="flex:1;min-width:0">${htmlContent}</span>
                                        </div>`);
        this._content.scrollTop = this._content.scrollHeight;
    }
}

customElements.define("tamper-window", TamperWindow);

function addTamperWindow(id = null) {
    console.log ('%cTamperMonkey : add window', 'color: green;');
    const tamperWin = document.createElement("tamper-window");
    if (id !== null) tamperWin.setAttribute ('id', id);
    document.body.appendChild(tamperWin);
    return tamperWin;
}
