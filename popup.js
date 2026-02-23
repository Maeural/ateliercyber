document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email');
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');

    // Charger l'email sauvegardé
    chrome.storage.local.get('notificationEmail', (data) => {
        if (data.notificationEmail) {
            emailInput.value = data.notificationEmail;
        }
    });

    // Sauvegarder l'email
    saveBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();

        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            showStatus('Veuillez entrer un email valide.', 'error');
            return;
        }

        chrome.storage.local.set({ notificationEmail: email }, () => {
            showStatus('Email enregistré avec succès !', 'success');

            // Fermer le popup après un court délai
            setTimeout(() => window.close(), 1500);
        });
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = 'status ' + type;

        if (type === 'error') {
            setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.className = 'status';
            }, 3000);
        }
    }
});
