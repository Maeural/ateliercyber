// background.js

// Écoute les messages venant de content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "blocked_tweet") { // Gardé pour compatibilité si besoin
        handleBlockedTweet();
    } else if (message.type === "check_content") {
        analyzeTextWithOllama(message.text).then(isToxic => {
            sendResponse({ isToxic: isToxic });
        }).catch(err => {
            console.error("Erreur Ollama:", err);
            sendResponse({ isToxic: false }); // Fail safe: ne pas bloquer en cas d'erreur
        });
        return true; // Indique que sendResponse est async
    }
});

const analyseEnCache = new Map();
const MAX_CACHE_SIZE = 1000; // Limite pour ne pas saturer la RAM du navigateur

async function analyzeTextWithOllama(text) {
    // 1. Vérifie si on a déjà analysé ce texte
    if (analyseEnCache.has(text)) {
        console.log(`Mémorisé en cache (safe/toxique déjà connu) : "${text.substring(0, 20)}..."`);
        return analyseEnCache.get(text);
    }

    try {
        console.log(`Analyse du texte via Ollama : "${text.substring(0, 20)}..."`);
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "heartshield-model",
                prompt: `### Instruction:\nDetermine if the following message contains hateful content. Answer only with 'True' or 'False'.\n\n### Input:\n${text}\n\n### Response:\n`,
                stream: false,
                keep_alive: -1
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Erreur Ollama Status: ${response.status}`);
            console.error(`Détail erreur: ${errorText}`);
            throw new Error(`Ollama API Error: ${response.status}`);
        }

        const data = await response.json();
        const answer = data.response.trim().toUpperCase();
        console.log(`Analysé: "${text.substring(0, 20)}..." -> ${answer}`);

        const isToxic = answer.includes("TRUE");

        // 2. Sauvegarde le résultat dans le cache pour la prochaine fois
        if (analyseEnCache.size > MAX_CACHE_SIZE) {
            // Nettoyage si on dépasse 1000 messages (supprime le plus ancien)
            const firstKey = analyseEnCache.keys().next().value;
            analyseEnCache.delete(firstKey);
        }
        analyseEnCache.set(text, isToxic);

        return isToxic;
    } catch (error) {
        console.error("Exception lors de l'appel Ollama (Vérifiez que `ollama serve` tourne et que le modèle `llama3` est installé):", error);
        return false;
    }
}

function handleBlockedTweet() {
    // Récupérer l'email configuré
    chrome.storage.local.get("notificationEmail", (data) => {
        const email = data.notificationEmail;

        if (email) {
            console.log(`Tentative d'envoi d'email à ${email} via EmailJS...`);

            // --- CONFIGURATION EMAILJS ---
            // Remplissez ces valeurs avec celles de votre compte EmailJS (https://dashboard.emailjs.com/)
            const SERVICE_ID = "service_rsqwxqw";   // ex: "service_xxxxx"
            const TEMPLATE_ID = "template_r7815q9"; // ex: "template_xxxxx"
            const PUBLIC_KEY = "QtFhlelsEFsA_u_2q";   // ex: "user_xxxxx" (ou Public Key)
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
                        console.log('Email envoyé avec succès !');
                    } else {
                        return response.text().then(text => { throw new Error(text) });
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de l\'envoi de l\'email :', error);
                });

            // Créer une notification native Chrome
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
