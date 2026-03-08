/**
 * Sunday Chats Window Application Module
 * Iframe window for https://sundaychats.vercel.app/ (Sunday Sessions)
 */
class SundayChatsApp extends BaseApp {
    constructor() {
        super({ windowId: 'sunday-chats-window', dockItemId: 'sunday-chats-dock-item' });
        this.init();
    }
}

window.SundayChatsAppClass = SundayChatsApp;

const initSundayChatsApp = () => {
    window.SundayChatsApp = new SundayChatsApp();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSundayChatsApp);
} else {
    initSundayChatsApp();
}

window.openSundayChatsWindow = () => window.SundayChatsApp?.open();
