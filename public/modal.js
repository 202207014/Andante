window.NeoModal = {
    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.2s ease-in-out';
        document.body.appendChild(overlay);
        // Force reflow
        overlay.offsetHeight;
        overlay.style.opacity = '1';
        return overlay;
    },
    _closeOverlay(overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 200);
    },
    confirm(message) {
        return new Promise(resolve => {
            const overlay = this._createOverlay();
            overlay.innerHTML = `
                <div class="brutal-card bg-white p-6 max-w-sm w-full shadow-brutal text-center flex flex-col gap-6 transform scale-95 transition-transform duration-200" style="opacity:0">
                    <h3 class="text-xl font-black leading-tight break-keep">${message}</h3>
                    <div class="flex gap-4 justify-center">
                        <button id="neo-cancel" class="brutal-btn bg-white px-6 py-2 border-2 border-black font-bold">취소</button>
                        <button id="neo-ok" class="brutal-btn bg-yellow px-6 py-2 border-2 border-black font-bold">확인</button>
                    </div>
                </div>
            `;
            const card = overlay.firstElementChild;
            card.offsetHeight;
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';

            overlay.querySelector('#neo-cancel').onclick = () => { this._closeOverlay(overlay); resolve(false); };
            overlay.querySelector('#neo-ok').onclick = () => { this._closeOverlay(overlay); resolve(true); };
        });
    },
    prompt(message, defaultValue = '') {
        return new Promise(resolve => {
            const overlay = this._createOverlay();
            overlay.innerHTML = `
                <div class="brutal-card bg-white p-6 max-w-sm w-full shadow-brutal flex flex-col gap-4 transform scale-95 transition-transform duration-200" style="opacity:0">
                    <h3 class="text-xl font-black leading-tight">${message}</h3>
                    <input type="text" id="neo-input" class="brutal-input w-full border-2 border-black p-3 font-bold" value="${defaultValue}">
                    <div class="flex gap-4 justify-end mt-2">
                        <button id="neo-cancel" class="brutal-btn bg-white px-6 py-2 border-2 border-black font-bold">취소</button>
                        <button id="neo-ok" class="brutal-btn bg-sky px-6 py-2 border-2 border-black font-bold">확인</button>
                    </div>
                </div>
            `;
            const card = overlay.firstElementChild;
            card.offsetHeight;
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';

            const input = overlay.querySelector('#neo-input');
            input.focus();
            input.select();

            overlay.querySelector('#neo-cancel').onclick = () => { this._closeOverlay(overlay); resolve(null); };
            overlay.querySelector('#neo-ok').onclick = () => { this._closeOverlay(overlay); resolve(input.value); };
        });
    }
};
