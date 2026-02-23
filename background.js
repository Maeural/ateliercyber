// background.js

// Écoute les messages venant de content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "blocked_tweet") {
        handleBlockedTweet();
    }
});



function handleBlockedTweet() {
    // Récupérer l'email configuré
    chrome.storage.local.get("notificationEmail", (data) => {
        const email = data.notificationEmail;

        if (email) {
            console.log(`Tentative d'envoi d'email à ${email} via EmailJS...`);

            // --- CONFIGURATION EMAILJS ---
            // Remplissez ces valeurs avec celles du compte EmailJS (https://dashboard.emailjs.com/)
            const SERVICE_ID = "service_rsqwxqw";
            const TEMPLATE_ID = "template_r7815q9";
            const PUBLIC_KEY = "QtFhlelsEFsA_u_2q";
            // -----------------------------

            const data = {
                service_id: SERVICE_ID,
                template_id: TEMPLATE_ID,
                user_id: PUBLIC_KEY,
                template_params: {
                    to_email: email,
                    message: "Un message suspect a été détecté et flouté."
                }
            };

            fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
                .then(response => {
                    if (response.ok) {
                        console.log("Email envoyé avec succès !");
                    } else {
                        return response.text().then(text => { throw new Error(text) });
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de l\'envoi de l\'email :', error);
                });

            // Créer une notification Chrome
            chrome.notifications.create({
                type: "basic",
                iconUrl: chrome.runtime.getURL("icons/iconheartshield.png"),
                title: "Contenu Suspect Bloqué",
                message: `Un message a été bloqué. Une alerte a été envoyée à ${email}.`,
                priority: 2
            });
        } else {
            console.log("Message bloqué, mais aucun email configuré pour l'alerte.");
        }
    });
}
