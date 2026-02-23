// content.js

console.log("HeartShield: Mode Multi-Plateforme Actif");

const MOT_INTERDIT = "ive";

function detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "twitter";
    if (hostname.includes("discord.com")) return "discord";
    if (hostname.includes("instagram.com")) return "instagram";
    if (hostname.includes("reddit.com")) return "reddit";
    return "unknown";
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
            textElement = element;
        }
    }
    // Protection si textElement est null
    const textContent = textElement ? textElement.textContent : "";
    console.log("Texte détecté:", textContent);
    let isDangerous = false;
    if (textContent && textContent.toLowerCase().includes(MOT_INTERDIT)) {
        isDangerous = true;
    }

    if (isDangerous) {
        // Appliquer le flou
        element.style.filter = "blur(5px)";
        element.style.pointerEvents = "none";
        element.style.userSelect = "none";

        // Notification
        try {
            chrome.runtime.sendMessage({ type: "blocked_tweet" });
        } catch (e) {
            console.log("Erreur envois message background:", e);
        }

        console.log(`CONTENU BLOQUÉ (${type}) : "${textContent}"`);
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