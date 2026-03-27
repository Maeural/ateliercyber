// content.js

console.log("HeartShield: Mode Multi-Plateforme Actif");

function detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "twitter";
    if (hostname.includes("discord.com")) return "discord";
    if (hostname.includes("instagram.com")) return "instagram";
    if (hostname.includes("reddit.com")) return "reddit";
    return "unknown";
}

// Fonction spécifique pour les commentaires Instagram (basée sur le code utilisateur)
function scanInstagramComments() {
    // 1. On cible uniquement la publication ouverte (soit la modale, soit la page dédiée)
    // Cela évite de récupérer les textes des posts qui sont derrière dans le fil d'actualité
    const conteneurActif = document.querySelector('div[role="dialog"]') || document.querySelector('main[role="main"]');

    if (conteneurActif) {
        // 2. On cherche les blocs de commentaires UNIQUEMENT dans le post ouvert
        const blocs = conteneurActif.querySelectorAll('.x1xegmmw, .x1iyjqo2');

        const textesSeuls = Array.from(blocs).map(bloc => {
            // Ciblage de la zone de texte du commentaire ou de la description
            const zoneTexte = bloc.querySelector('.x1cy8zhl span, ._a9zs span');

            if (zoneTexte) {
                let clone = zoneTexte.cloneNode(true);

                // On dégage les liens (pseudos, mentions, hashtags) et les boutons
                clone.querySelectorAll('a, [role="button"]').forEach(el => el.remove());

                return clone.innerText.trim();
            }
            return null;
        })
            .filter(t => t && t.length > 0);

        // 3. On utilise un Set pour supprimer les doublons (Instagram répète souvent les blocs en HTML)
        const resultatUnique = [...new Set(textesSeuls)];

        console.log(resultatUnique.join('\n---\n'));
    } else {
        console.log("Aucune publication ouverte détectée.");
    }
}

function processContent(element, platform) {
    if (element.dataset.processed) return;

    let textElement = null;
    let type = "unknown";

    if (platform === "twitter") {
        if (element.getAttribute("data-testid") === "tweet") {
            type = "tweet";
            textElement = element.querySelector('[data-testid="tweetText"]');
        } else {
            type = "dm";
            // Logique DM X : cherche dir="auto"
            textElement = element.querySelector('[dir="auto"]');
        }
    } else if (platform === "discord") {
        type = "discord_msg";
        // Sur Discord web, l'élément ID message-content-XYZ contient directement le texte
        textElement = element;
    } else if (platform === "instagram") {
        type = "instagram_msg";
        textElement = element;
    } else if (platform === "reddit") {
        type = "reddit_content";
        // Reddit : on cible les paragraphes de texte (posts et commentaires)
        if (element.matches('p')) {
            textElement = element; // Le texte est directement dans le <p>
        }
    }
    // Protection si textElement est null
    const textContent = textElement ? textElement.textContent : "";
    console.log("Texte détecté:", textContent);

    // Nouvelle logique async avec Ollama
    if (textContent && textContent.trim().length > 0) {
        // Sauvegarder le texte original
        element.dataset.originalText = textContent;

        // Afficher "Analyse en cours..." immédiatement et flouter
        if (textElement) {
            textElement.textContent = "Analyse HeartShield en cours...";
            //element.style.filter = "blur(5px)";
            // On peut laisser pointerEvents/userSelect activés ou non pendant l'analyse, 
            // ici on bloque pour éviter les interactions sur un contenu potentiellement toxique
            element.style.pointerEvents = "none";
        }

        chrome.runtime.sendMessage({
            type: "check_content",
            text: textContent
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Erreur communication extension:", chrome.runtime.lastError);
                // En cas d'erreur technique, on restaure le texte original
                if (textElement && element.dataset.originalText) {
                    textElement.textContent = element.dataset.originalText;
                    element.style.filter = "";
                    element.style.pointerEvents = "";
                }
                return;
            }

            if (response && response.isToxic) {
                // TOXIQUE : On garde le flou et on change le message
                if (textElement) {
                    textElement.textContent = "Message bloqué";
                }
                element.style.filter = "blur(5px)";
                element.style.pointerEvents = "none";
                element.style.userSelect = "none";

                console.log(`CONTENU BLOQUÉ PAR IA (${type}) : "${element.dataset.originalText}"`);
            } else {
                // SAFE : On restaure le texte original
                if (textElement && element.dataset.originalText) {
                    textElement.textContent = element.dataset.originalText;
                    element.style.filter = "";
                    element.style.pointerEvents = "";
                    element.style.userSelect = "";
                }
                console.log(`CONTENU SAFE (${type})`);
            }
        });
    }

    element.dataset.processed = "true";
}

function scanForContent() {
    const platform = detectPlatform();
    if (platform === "unknown") return;

    let selector = "";
    if (platform === "twitter") {
        selector = '[data-testid="tweet"], [data-testid^="message-text-"]';
    } else if (platform === "discord") {
        selector = '[id^="message-content-"]';
    } else if (platform === "instagram") {
        selector = 'div[dir="auto"]';
    } else if (platform === "reddit") {
        // Reddit (Shreddit UI) : le texte est dans des slots spécifiques
        // "text-body" pour les posts, "comment" pour les commentaires
        selector = 'div[slot="text-body"] p, div[slot="comment"] p, shreddit-post p, shreddit-comment p';
    }

    if (!selector) return;

    const elements = document.querySelectorAll(selector);
    elements.forEach(el => processContent(el, platform));
}

// Observateur pour le scroll infini / chargement dynamique
const observer = new MutationObserver((mutations) => {
    scanForContent();
    if (detectPlatform() === "instagram") {
        scanInstagramComments();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Premier lancement
scanForContent();
if (detectPlatform() === "instagram") {
    scanInstagramComments();
}