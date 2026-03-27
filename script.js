// Script pour le Pip-Boy Médical
const historyItems = [];

function beep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        oscillator.connect(gain);
        gain.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
        console.warn('Beep non pris en charge', e);
    }
}

function setAllHealthToMax() {
    document.querySelectorAll('.health-fill').forEach(el => {
        el.style.width = '100%';
    });
}

function getAIMode() {
    const modeSelect = document.getElementById('ai-mode');
    return modeSelect?.value || 'gratuit';
}

function getFreeAIResponse(symptoms) {
    const lower = symptoms.toLowerCase();

    const douleurReponses = [
        `IA local : vous évoquez une sensation de douleur. Reposez-vous, hydratez-vous et surveillez l'évolution. Si rien ne change en 48h, consultez un professionnel.`,
        `IA local : ce type de douleur peut venir d'une inflammation. Appliquez du froid/chaud selon le cas, et gardez le stress sous contrôle.`,
        `IA local : je suggère repos + antalgique doux, et un suivi médical rapide si l'intensité augmente.`
    ];

    const touxReponses = [
        `IA local : cela ressemble à un rhume. Hydratez-vous, restez au chaud, et prenez un décongestionnant si nécessaire.`,
        `IA local : toux fréquente détectée. Buvez du thé au miel et si une fièvre apparaît, consultez.`,
        `IA local : possible irritation respiratoire. Limitez la poussière/fumée et voyez un médecin si s'aggrave.`
    ];

    const traumatismeReponses = [
        `IA local : cela semble lié à un traumatisme. Immobilisez, surélevez, et consultez pour imagerie si douleur persistante.`,
        `IA local : blessure probable. Glaçage, repos et assistance pro conseillés.`,
        `IA local : entorse/fracture possible. Evitez de forcer et prenez un avis médical immédiatement.`
    ];

    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    if (/douleur|mal|fièvre|fievre/.test(lower)) {
        return pick(douleurReponses);
    }
    if (/toux|rhume|nez|grippe/.test(lower)) {
        return pick(touxReponses);
    }
    if (/fracture|os|entorse|blessure|bleu|coup/.test(lower)) {
        return pick(traumatismeReponses);
    }

    const genericReponses = [
        `IA local : demande un peu plus de détails (localisation, intensité, date de début, symptômes associés).`,
        `IA local : symptôme reçu. Peux-tu préciser si c'est aigu, chronique, ou par épisodes ?`,
        `IA local : j’ai besoin de plus d’infos pour proposer un guide fiable. Exemple : "depuis 2 jours, douleur au genou, gonflement".`
    ];

    return pick(genericReponses);
}

// Alias demandé "getFreeAIReponse" (orthographe alternative/française)
function getFreeAIReponse(symptoms) {
    return getFreeAIResponse(symptoms);
}

function sanitizeInput(text) {
    const trimmed = text.trim();
    if (trimmed.length === 0) return '';

    const unsafe = /<[^>]*>|\bscript\b|\biframe\b|\bobject\b/i;
    if (unsafe.test(trimmed)) {
        return '<<<entrée invalide détectée>>>';
    }

    return trimmed.replace(/["'<>\\]/g, '');
}

function addToHistory(symptoms, response) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    historyItems.unshift({ timestamp, symptoms, response });

    const historyEl = document.getElementById('history');
    historyEl.innerHTML = '';

    for (const item of historyItems.slice(0, 10)) {
        const li = document.createElement('li');
        li.innerHTML = `<strong>[${item.timestamp}]</strong> <br> Symptôme: ${item.symptoms} <br> Réponse: ${item.response}`;
        historyEl.appendChild(li);
    }
}

document.getElementById('submit-btn').addEventListener('click', async () => {
    const rawSymptoms = document.getElementById('symptoms').value;
    const symptoms = sanitizeInput(rawSymptoms);
    const alertEl = document.getElementById('alert');

    if (!symptoms) {
        alertEl.textContent = 'Veuillez saisir un symptôme valide.';
        document.getElementById('response').textContent = '';
        return;
    }

    alertEl.textContent = '';
    const formattedMessage = `j'ai mal voici les symptômes : ${symptoms}`;

    // Jouer le beep du Pip-Boy
    beep();

    document.getElementById('response').textContent = 'Analyse en cours...';

    let aiResponse;
    const mode = getAIMode();

    if (mode === 'gratuit') {
        aiResponse = getFreeAIResponse(symptoms);
        alertEl.textContent = 'IA locale gratuite utilisée.';
    } else {
        aiResponse = `Simulation : j'ai bien reçu vos symptômes. Voici une réponse factice pour test : ${formattedMessage}`;
        alertEl.textContent = 'Mode simulation utilisé.';
    }

    document.getElementById('response').textContent = `Réponse :\n${aiResponse}`;

    // Après l'analyse, on remet la santé max pour que ça soit visible comme 'plein'.
    setAllHealthToMax();

    addToHistory(symptoms, aiResponse);
});

// Gestion des onglets
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (!tab) return; // Pas un onglet (ex. bouton Corps)

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(tab + '-tab').classList.add('active');
    });
});

// Optionnel : touche Enter pour envoyer si focus dans textarea
const textarea = document.getElementById('symptoms');
textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.shiftKey === false) {
        e.preventDefault();
        document.getElementById('submit-btn').click();
    }
});

// Afficher la photo du corps humain en cliquant sur le bouton Corps
const corpsBtn = document.getElementById('corps-btn');
const photoCorps = document.getElementById('photo-corps');
corpsBtn.addEventListener('click', () => {
    if (photoCorps.hasAttribute('hidden')) {
        photoCorps.removeAttribute('hidden');
        corpsBtn.textContent = 'Masquer corps';
    } else {
        photoCorps.setAttribute('hidden', '');
        corpsBtn.textContent = 'Corps';
    }
});

// Assure que le niveau de vie est à 100% une fois la page chargée
setAllHealthToMax();
