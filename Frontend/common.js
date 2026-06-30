// API & Authentication Configuration
const API_BASE = "http://localhost:4000/api";

function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

function isLoggedIn() {
    return !!localStorage.getItem("token");
}

function getCurrentUser() {
    const userStr = localStorage.getItem("user");
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        return null;
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "Landing.html";
}

// Injected Custom Premium Popups & Toast Styles
(function injectStyles() {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
        /* Glassmorphic Modal Styles */
        .eventpro-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(11, 17, 32, 0.7);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .eventpro-modal-overlay.active {
            opacity: 1;
        }
        .eventpro-modal-box {
            background: rgba(31, 41, 55, 0.85);
            border: 1px solid rgba(255, 193, 7, 0.25);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
            border-radius: 16px;
            padding: 28px;
            width: 420px;
            max-width: 90%;
            transform: scale(0.85);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            color: #ffffff;
            font-family: Arial, sans-serif;
        }
        .eventpro-modal-overlay.active .eventpro-modal-box {
            transform: scale(1);
        }
        .eventpro-modal-title {
            font-size: 22px;
            font-weight: bold;
            color: #ffc107;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .eventpro-modal-message {
            font-size: 15px;
            line-height: 1.6;
            color: #e5e7eb;
            margin-bottom: 24px;
        }
        .eventpro-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }
        .eventpro-modal-btn {
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s ease;
            border: none;
        }
        .eventpro-modal-btn-confirm {
            background: #ffc107;
            color: #000000;
        }
        .eventpro-modal-btn-confirm:hover {
            background: #e0a800;
            transform: translateY(-2px);
        }
        .eventpro-modal-btn-cancel {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
        }
        .eventpro-modal-btn-cancel:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }

        /* Toast Styles */
        #eventpro-toast-container {
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 350px;
            width: 100%;
        }
        .eventpro-toast {
            background: rgba(31, 41, 55, 0.9);
            border-radius: 12px;
            padding: 16px 20px;
            color: #ffffff;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            transform: translateX(120%);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
            opacity: 0;
            position: relative;
            overflow: hidden;
        }
        .eventpro-toast.active {
            transform: translateX(0);
            opacity: 1;
        }
        .eventpro-toast-success {
            border-left: 5px solid #10b981;
        }
        .eventpro-toast-error {
            border-left: 5px solid #ef4444;
        }
        .eventpro-toast-info {
            border-left: 5px solid #3b82f6;
        }
        .eventpro-toast-close {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        }
        .eventpro-toast-close:hover {
            color: #ffffff;
        }
    `;
    document.head.appendChild(styleEl);
})();

// Custom Popup Library Namespace
const EventProUI = {
    _getOrCreateToastContainer() {
        let container = document.getElementById("eventpro-toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "eventpro-toast-container";
            document.body.appendChild(container);
        }
        return container;
    },

    toast(message, type = "success") {
        const container = this._getOrCreateToastContainer();
        const toast = document.createElement("div");
        toast.className = `eventpro-toast eventpro-toast-${type}`;
        
        let icon = "✨";
        if (type === "success") icon = "✅";
        if (type === "error") icon = "❌";
        if (type === "info") icon = "ℹ️";

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>${icon}</span>
                <span style="font-weight: 500;">${message}</span>
            </div>
            <button class="eventpro-toast-close">&times;</button>
        `;

        container.appendChild(toast);

        // Slide in
        setTimeout(() => toast.classList.add("active"), 10);

        // Click close
        toast.querySelector(".eventpro-toast-close").addEventListener("click", () => {
            this.dismissToast(toast);
        });

        // Auto dismiss
        setTimeout(() => {
            this.dismissToast(toast);
        }, 4000);
    },

    dismissToast(toast) {
        if (!toast || !toast.parentNode) return;
        toast.style.transform = "translateX(120%)";
        toast.style.opacity = "0";
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    },

    alert(title, message) {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.className = "eventpro-modal-overlay";
            overlay.innerHTML = `
                <div class="eventpro-modal-box">
                    <div class="eventpro-modal-title">🔔 ${title}</div>
                    <div class="eventpro-modal-message">${message}</div>
                    <div class="eventpro-modal-actions">
                        <button class="eventpro-modal-btn eventpro-modal-btn-confirm">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            // Trigger animations
            setTimeout(() => overlay.classList.add("active"), 10);

            const confirmBtn = overlay.querySelector(".eventpro-modal-btn-confirm");
            confirmBtn.focus();

            confirmBtn.addEventListener("click", () => {
                overlay.classList.remove("active");
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve();
                }, 300);
            });
        });
    },

    confirm(title, message) {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            overlay.className = "eventpro-modal-overlay";
            overlay.innerHTML = `
                <div class="eventpro-modal-box">
                    <div class="eventpro-modal-title">❓ ${title}</div>
                    <div class="eventpro-modal-message">${message}</div>
                    <div class="eventpro-modal-actions">
                        <button class="eventpro-modal-btn eventpro-modal-btn-cancel">Cancel</button>
                        <button class="eventpro-modal-btn eventpro-modal-btn-confirm">Confirm</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            // Trigger animations
            setTimeout(() => overlay.classList.add("active"), 10);

            const confirmBtn = overlay.querySelector(".eventpro-modal-btn-confirm");
            const cancelBtn = overlay.querySelector(".eventpro-modal-btn-cancel");
            confirmBtn.focus();

            confirmBtn.addEventListener("click", () => {
                overlay.classList.remove("active");
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve(true);
                }, 300);
            });

            cancelBtn.addEventListener("click", () => {
                overlay.classList.remove("active");
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve(false);
                }, 300);
            });
        });
    }
};

// Override standard browser alert for maximum beauty and backward compatibility
window.alert = function(message) {
    EventProUI.toast(message, "info");
};
