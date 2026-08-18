'use strict';

/* =====================================================
   SECURITE AFFICHAGE AU DEMARRAGE
   ===================================================== */

document.documentElement.classList.add('admin-chargement');

document.addEventListener('DOMContentLoaded', () => {

    const zoneActionAdmin =
        document.getElementById('zoneActionAdmin');

    const sectionBulletin =
        document.getElementById('sectionBulletin');

    const sectionModification =
        document.getElementById('sectionModification');

    if (zoneActionAdmin) {
        zoneActionAdmin.style.display = 'none';
    }

    if (sectionBulletin) {
        sectionBulletin.style.display = 'none';
    }

    if (sectionModification) {
        sectionModification.style.display = 'none';
    }

    document.documentElement.classList.remove(
        'admin-chargement'
    );

});

/* =====================================================
   PORTAIL BULLETINS DE NOTES
   ADMINISTRATION
   ===================================================== */


/* =====================================================
   ELEMENTS
   ===================================================== */

let formAgent;
let messageAgent;

let formRechercheAdmin;
let rechercheAdmin;
let resultatsAdmin;

let zoneActionAdmin;
let sectionBulletin;
let sectionModification;

let formBulletin;
let formModificationAgent;

let agentId;
let agentSelectionne;
let listeBulletins;

let messageBulletin;
let messageModification;


/* =====================================================
   OUTILS
   ===================================================== */

function escapeHtml(value) {

    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


function afficherMessage(element, texte, type = '') {

    if (!element) {
        return;
    }

    element.textContent = texte;

    element.className =
        `message ${type}`;

}


/* =====================================================
   VERIFICATION SESSION
   ===================================================== */

async function verifierSessionAdmin() {

    try {

        const response =
            await fetch(
                '/api/admin-session',
                {
                    method: 'GET',
                    credentials: 'same-origin'
                }
            );


        if (response.status === 401) {

            window.location.href =
                '/connexion-admin';

            return false;

        }


        if (!response.ok) {

            window.location.href =
                '/connexion-admin';

            return false;

        }


        return true;


    } catch (error) {

        console.error(
            'Erreur de vérification de session :',
            error
        );

        window.location.href =
            '/connexion-admin';

        return false;

    }

}


/* =====================================================
   DECONNEXION
   ===================================================== */

async function deconnecterAdmin() {

    const confirmation =
        confirm(
            'Voulez-vous vraiment vous déconnecter ?'
        );


    if (!confirmation) {
        return;
    }


    try {

        await fetch(
            '/api/admin-logout',
            {
                method: 'POST',
                credentials: 'same-origin'
            }
        );

    } catch (error) {

        console.error(
            'Erreur de déconnexion :',
            error
        );

    }


    window.location.href =
        '/connexion-admin';

}


/* =====================================================
   CACHER TOUTES LES ZONES D'ACTION
   ===================================================== */

function cacherSections() {

    if (zoneActionAdmin) {

        zoneActionAdmin.style.display =
            'none';

    }


    if (sectionBulletin) {

        sectionBulletin.style.display =
            'none';

    }


    if (sectionModification) {

        sectionModification.style.display =
            'none';

    }

}


/* =====================================================
   VERIFIER LA ZONE UNIQUE
   ===================================================== */

function verifierZoneAction() {

    if (!zoneActionAdmin) {
        return;
    }


    const bulletinVisible =
        sectionBulletin &&
        sectionBulletin.style.display !== 'none';


    const modificationVisible =
        sectionModification &&
        sectionModification.style.display !== 'none';


    if (
        !bulletinVisible &&
        !modificationVisible
    ) {

        zoneActionAdmin.style.display =
            'none';

    }

}


/* =====================================================
   STATISTIQUES
   ===================================================== */

async function chargerStatistiques() {

    const total =
        document.getElementById(
            'totalBulletins'
        );


    const nombreAnnees =
        document.getElementById(
            'nombreAnnees'
        );


    const conteneur =
        document.getElementById(
            'statistiquesAnnees'
        );


    if (!conteneur) {
        return;
    }


    try {

        const response =
            await fetch(
                '/api/admin/statistiques',
                {
                    method: 'GET',
                    credentials: 'same-origin'
                }
            );


        if (response.status === 401) {

            window.location.href =
                '/connexion-admin';

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                'Impossible de charger les statistiques.'
            );

        }


        if (total) {

            total.textContent =
                data.total ?? 0;

        }


        const annees =
            data.annees || [];


        if (nombreAnnees) {

            nombreAnnees.textContent =
                annees.length;

        }


        if (!annees.length) {

            conteneur.innerHTML =
                '<div class="stat-chargement">Aucun bulletin enregistré.</div>';

            return;

        }


        conteneur.innerHTML =
            annees
                .map(
                    item => `

                        <div class="stat-annee">

                            <div class="stat-annee-annee">
                                ${escapeHtml(item.annee)}
                            </div>

                            <div class="stat-annee-nombre">
                                ${escapeHtml(item.nombre)}
                            </div>

                            <div class="stat-annee-label">
                                bulletin(s) enregistré(s)
                            </div>

                        </div>

                    `
                )
                .join('');


    } catch (error) {

        console.error(
            'Erreur statistiques :',
            error
        );


        conteneur.innerHTML =
            `<div class="message erreur">
                ${escapeHtml(error.message)}
            </div>`;

    }

}


/* =====================================================
   CREER UN AGENT
   ===================================================== */

async function creerAgent(event) {

    event.preventDefault();


    afficherMessage(
        messageAgent,
        'Enregistrement en cours...'
    );


    const champNom =
        document.getElementById('nom');

    const champPrenom =
        document.getElementById('prenom');

    const champMecano =
        document.getElementById('mecano');

    const champService =
        document.getElementById('service');

    const champGrade =
        document.getElementById('grade');

    const champFonction =
        document.getElementById('fonction');


    const donnees = {

        nom:
            champNom
                ? champNom.value.trim()
                : '',

        prenom:
            champPrenom
                ? champPrenom.value.trim()
                : '',

        mecano:
            champMecano
                ? champMecano.value.trim()
                : '',

        service:
            champService
                ? champService.value.trim()
                : '',

        grade:
            champGrade
                ? champGrade.value.trim()
                : '',

        fonction:
            champFonction
                ? champFonction.value.trim()
                : ''

    };


    try {

        const response =
            await fetch(
                '/api/admin/agents',
                {

                    method: 'POST',

                    credentials:
                        'same-origin',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify(
                            donnees
                        )

                }
            );


        if (response.status === 401) {

            window.location.href =
                '/connexion-admin';

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                'Erreur lors de l’enregistrement.'
            );

        }


        afficherMessage(
            messageAgent,
            data.message ||
            'Agent enregistré avec succès.',
            'succes'
        );


        formAgent.reset();


        await chargerStatistiques();


    } catch (error) {

        console.error(
            'Erreur création agent :',
            error
        );


        afficherMessage(
            messageAgent,
            error.message,
            'erreur'
        );

    }

}


/* =====================================================
   RECHERCHE AGENT
   ===================================================== */

async function rechercherAgent(event) {

    event.preventDefault();


    const recherche =
        rechercheAdmin
            ? rechercheAdmin.value.trim()
            : '';


    if (!recherche) {

        if (resultatsAdmin) {

            resultatsAdmin.innerHTML =
                '<div class="resultat-vide">Veuillez saisir une recherche.</div>';

        }

        return;

    }


    if (resultatsAdmin) {

        resultatsAdmin.innerHTML =
            '<div class="stat-chargement">Recherche en cours...</div>';

    }


    try {

        const response =
            await fetch(
                `/api/admin/agents/recherche?recherche=${encodeURIComponent(recherche)}`,
                {
                    method: 'GET',
                    credentials: 'same-origin'
                }
            );


        if (response.status === 401) {

            window.location.href =
                '/connexion-admin';

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                'Erreur de recherche.'
            );

        }


        afficherAgents(
            data.agents || []
        );


    } catch (error) {

        console.error(
            'Erreur recherche agent :',
            error
        );


        if (resultatsAdmin) {

            resultatsAdmin.innerHTML =
                `<div class="message erreur">
                    ${escapeHtml(error.message)}
                </div>`;

        }

    }

}


/* =====================================================
   AFFICHER LES AGENTS
   ===================================================== */

function afficherAgents(agents) {

    if (!resultatsAdmin) {
        return;
    }


    if (!agents.length) {

        resultatsAdmin.innerHTML =
            '<div class="resultat-vide">Aucun agent trouvé.</div>';

        return;

    }


    resultatsAdmin.innerHTML =
        '';


    agents.forEach(
        agent => {

            const carte =
                document.createElement(
                    'div'
                );


            carte.className =
                'agent-resultat';


            carte.innerHTML = `

                <div class="agent-informations">

                    <strong>
                        ${escapeHtml(agent.nom)}
                        ${escapeHtml(agent.prenom)}
                    </strong>

                    <span>
                        Mécano :
                        ${escapeHtml(agent.mecano)}
                    </span>

                    <span>
                        Service :
                        ${escapeHtml(agent.service || '-')}
                    </span>

                    <span>
                        Grade :
                        ${escapeHtml(agent.grade || '-')}
                    </span>

                    <span>
                        Fonction :
                        ${escapeHtml(agent.fonction || '-')}
                    </span>

                </div>


                <div class="actions-agent">

                    <button
                        type="button"
                        class="btn-selectionner"
                    >
                        📄 Gérer les bulletins
                    </button>


                    <button
                        type="button"
                        class="btn-modifier"
                    >
                        ✏️ Modifier
                    </button>

                </div>

            `;


            const btnSelectionner =
                carte.querySelector(
                    '.btn-selectionner'
                );


            const btnModifier =
                carte.querySelector(
                    '.btn-modifier'
                );


            if (btnSelectionner) {

                btnSelectionner.addEventListener(
                    'click',
                    () => {

                        ouvrirBulletins(
                            agent
                        );

                    }
                );

            }


            if (btnModifier) {

                btnModifier.addEventListener(
                    'click',
                    () => {

                        ouvrirModification(
                            agent
                        );

                    }
                );

            }


            resultatsAdmin.appendChild(
                carte
            );

        }
    );

}


/* =====================================================
   OUVRIR GESTION DES BULLETINS
   ===================================================== */

async function ouvrirBulletins(agent) {

    /*
       Fermer complètement la modification.
    */

    if (sectionModification) {

        sectionModification.style.display =
            'none';

    }


    /*
       Afficher la zone unique.
    */

    if (zoneActionAdmin) {

        zoneActionAdmin.style.display =
            'block';

    }


    /*
       Afficher uniquement les bulletins.
    */

    if (sectionBulletin) {

        sectionBulletin.style.display =
            'block';

    }


    /*
       Enregistrer l'ID de l'agent.
    */

    if (agentId) {

        agentId.value =
            agent.id;

    }


    /*
       Afficher l'agent sélectionné.
    */

    if (agentSelectionne) {

        agentSelectionne.innerHTML = `

            <strong>
                AGENT SÉLECTIONNÉ
            </strong>

            <div class="agent-selectionne-nom">
                ${escapeHtml(agent.nom)}
                ${escapeHtml(agent.prenom)}
            </div>

            <div>
                Mécano :
                ${escapeHtml(agent.mecano)}
            </div>

            <div>
                Service :
                ${escapeHtml(agent.service || '-')}
            </div>

            <div>
                Grade :
                ${escapeHtml(agent.grade || '-')}
            </div>

        `;

    }


    /*
       Charger les bulletins.
    */

    await chargerBulletins(
        agent.id
    );


    /*
       Faire défiler vers la zone.
    */

    if (zoneActionAdmin) {

        zoneActionAdmin.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

    }

}


/* =====================================================
   FERMER GESTION DES BULLETINS
   ===================================================== */

function fermerBulletins() {

    if (sectionBulletin) {

        sectionBulletin.style.display =
            'none';

    }


    if (agentId) {

        agentId.value =
            '';

    }


    if (agentSelectionne) {

        agentSelectionne.innerHTML =
            '';

    }


    if (listeBulletins) {

        listeBulletins.innerHTML =
            '';

    }


    verifierZoneAction();

}


/* =====================================================
   CHARGER LES BULLETINS
   ===================================================== */

async function chargerBulletins(id) {

    if (!listeBulletins) {
        return;
    }


    listeBulletins.innerHTML =
        '<div class="stat-chargement">Chargement des bulletins...</div>';


    try {

        const response =
            await fetch(
                `/api/admin/agents/${encodeURIComponent(id)}/bulletins`,
                {
                    method: 'GET',
                    credentials: 'same-origin'
                }
            );


        if (response.status === 401) {

            window.location.href =
                '/connexion-admin';

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                'Impossible de charger les bulletins.'
            );

        }


        afficherBulletins(
            data.bulletins || []
        );


    } catch (error) {

        console.error(
            'Erreur chargement bulletins :',
            error
        );


        listeBulletins.innerHTML =
            `<div class="message erreur">
                ${escapeHtml(error.message)}
            </div>`;

    }

}


/* =====================================================
   AFFICHER LES BULLETINS
   ===================================================== */

function afficherBulletins(bulletins) {

    if (!listeBulletins) {
        return;
    }


    if (!bulletins.length) {

        listeBulletins.innerHTML =
            '<div class="resultat-vide">Aucun bulletin enregistré pour cet agent.</div>';

        return;

    }


    listeBulletins.innerHTML =
        '';


    bulletins.forEach(
        bulletin => {

            const ligne =
                document.createElement(
                    'div'
                );


            ligne.className =
                'bulletin-ligne';


            ligne.innerHTML = `

                <div class="bulletin-informations">

                    <strong>
                        ${escapeHtml(bulletin.annee)}
                    </strong>

                    <span>
                        ${escapeHtml(
                            bulletin.periode ||
                            'Annuelle'
                        )}
                    </span>

                    ${
                        bulletin.test === true
                        ? '<span class="badge-test">TEST</span>'
                        : ''
                    }

                </div>


                <div class="bulletin-actions">

                    ${
                        bulletin.fichier
                        ? `
                            <a
                                href="/api/admin/bulletins/${encodeURIComponent(bulletin.id)}/voir"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="btn-voir"
                            >
                                Voir
                            </a>
                        `
                        : ''
                    }


                    <button
                        type="button"
                        class="btn-supprimer-bulletin"
                    >
                        Supprimer
                    </button>

                </div>

            `;


            const btnSupprimer =
                ligne.querySelector(
                    '.btn-supprimer-bulletin'
                );


            if (btnSupprimer) {

                btnSupprimer.addEventListener(
                    'click',
                    () => {

                        supprimerBulletin(
                            bulletin.id
                        );

                    }
                );

            }


            listeBulletins.appendChild(
                ligne
            );

        }
    );

}


/* =====================================================
   SUPPRIMER UN BULLETIN
   ===================================================== */

async function supprimerBulletin(id) {

    const confirmation =
        confirm(
            'Voulez-vous vraiment supprimer ce bulletin ?\n\nCette action est définitive.'
        );


    if (!confirmation) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/admin/bulletins/${encodeURIComponent(id)}`,
                {
                    method: 'DELETE',
                    credentials: 'same-origin'
                }
            );


        if (response.status === 401) {

            window.location.href =
                '/connexion-admin';

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                'Impossible de supprimer le bulletin.'
            );

        }


        afficherMessage(
            messageBulletin,
            data.message ||
            'Bulletin supprimé.',
            'succes'
        );


        if (
            agentId &&
            agentId.value
        ) {

            await chargerBulletins(
                agentId.value
            );

        }


        await chargerStatistiques();


    } catch (error) {

        console.error(
            'Erreur suppression bulletin :',
            error
        );


        afficherMessage(
            messageBulletin,
            error.message,
            'erreur'
        );

    }

}


/* =====================================================
   OUVRIR MODIFICATION
   ===================================================== */

function ouvrirModification(agent) {

    /*
       Fermer les bulletins.
    */

    if (sectionBulletin) {

        sectionBulletin.style.display =
            'none';

    }


    /*
       Afficher la zone unique.
    */

    if (zoneActionAdmin) {

        zoneActionAdmin.style.display =
            'block';

    }


    /*
       Afficher uniquement la modification.
    */

    if (sectionModification) {

        sectionModification.style.display =
            'block';

    }


    const modificationAgentId =
        document.getElementById(
            'modificationAgentId'
        );


    const modificationNom =
        document.getElementById(
            'modificationNom'
        );


    const modificationPrenom =
        document.getElementById(
            'modificationPrenom'
        );


    const modificationMecano =
        document.getElementById(
            'modificationMecano'
        );


    const modificationService =
        document.getElementById(
            'modificationService'
        );


    const modificationGrade =
        document.getElementById(
            'modificationGrade'
        );


    const modificationFonction =
        document.getElementById(
            'modificationFonction'
        );


    if (modificationAgentId) {

        modificationAgentId.value =
            agent.id;

    }


    if (modificationNom) {

        modificationNom.value =
            agent.nom || '';

    }


    if (modificationPrenom) {

        modificationPrenom.value =
            agent.prenom || '';

    }


    if (modificationMecano) {

        modificationMecano.value =
            agent.mecano || '';

    }


    if (modificationService) {

        modificationService.value =
            agent.service || '';

    }


    if (modificationGrade) {

        modificationGrade.value =
            agent.grade || '';

    }


    if (modificationFonction) {

        modificationFonction.value =
            agent.fonction || '';

    }


    /*
       Faire défiler vers la zone.
    */

    if (zoneActionAdmin) {

        zoneActionAdmin.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

    }

}


/* =====================================================
   FERMER MODIFICATION
   ===================================================== */

function fermerModification() {

    if (sectionModification) {

        sectionModification.style.display =
            'none';

    }


    if (formModificationAgent) {

        formModificationAgent.reset();

    }


    verifierZoneAction();

}


/* =====================================================
   ENREGISTRER MODIFICATION AGENT
   ===================================================== */

async function enregistrerModification(event) {

    event.preventDefault();


    const champId =
        document.getElementById(
            'modificationAgentId'
        );


    const id =
        champId
            ? champId.value
            : '';


    if (!id) {

        afficherMessage(
            messageModification,
            'Agent introuvable.',
            'erreur'
        );

        return;

    }


    const champNom =
        document.getElementById(
            'modificationNom'
        );


    const champPrenom =
        document.getElementById(
            'modificationPrenom'
        );


    const champMecano =
        document.getElementById(
            'modificationMecano'
        );


    const champService =
        document.getElementById(
            'modificationService'
        );


    const champGrade =
        document.getElementById(
            'modificationGrade'
        );


    const champFonction =
        document.getElementById(
            'modificationFonction'
        );


    const donnees = {

        nom:
            champNom
                ? champNom.value.trim()
                : '',

        prenom:
            champPrenom
                ? champPrenom.value.trim()
                : '',

        mecano:
            champMecano
                ? champMecano.value.trim()
                : '',

        service:
            champService
                ? champService.value.trim()
                : '',

        grade:
            champGrade
                ? champGrade.value.trim()
                : '',

        fonction:
            champFonction
                ? champFonction.value.trim()
                : ''

    };


    afficherMessage(
        messageModification,
        'Enregistrement des modifications...'
    );


    try {

        const response =
            await fetch(
                `/api/admin/agents/${encodeURIComponent(id)}`,
                {

                    method: 'PUT',

                    credentials:
                        'same-origin',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify(
                            donnees
                        )

                }
            );


        if (response.status === 401) {

            window.location.href =
                '/connexion-admin';

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                'Impossible de modifier l’agent.'
            );

        }


        afficherMessage(
            messageModification,
            data.message ||
            'Agent modifié avec succès.',
            'succes'
        );


        setTimeout(
            async () => {

                fermerModification();


                /*
                   Relancer la recherche
                   pour afficher les nouvelles
                   informations.
                */

                if (
                    formRechercheAdmin &&
                    rechercheAdmin &&
                    rechercheAdmin.value.trim()
                ) {

                    await rechercherAgent(
                        new Event('submit')
                    );

                }

            },
            800
        );


    } catch (error) {

        console.error(
            'Erreur modification agent :',
            error
        );


        afficherMessage(
            messageModification,
            error.message,
            'erreur'
        );

    }

}


/* =====================================================
   AJOUTER UN BULLETIN
   ===================================================== */

async function ajouterBulletin(event) {

    event.preventDefault();


    if (
        !agentId ||
        !agentId.value
    ) {

        afficherMessage(
            messageBulletin,
            'Veuillez sélectionner un agent.',
            'erreur'
        );

        return;

    }


    afficherMessage(
        messageBulletin,
        'Enregistrement du bulletin...'
    );


    try {

        const response =
            await fetch(
                '/api/admin/bulletins',
                {

                    method: 'POST',

                    credentials:
                        'same-origin',

                    body:
                        new FormData(
                            formBulletin
                        )

                }
            );


        if (response.status === 401) {

            window.location.href =
                '/connexion-admin';

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                'Erreur lors de l’enregistrement.'
            );

        }


        const id =
            agentId.value;


        afficherMessage(
            messageBulletin,
            data.message ||
            'Bulletin enregistré.',
            'succes'
        );


        formBulletin.reset();


        /*
           Le reset peut vider agentId
           si le champ est dans le formulaire.
           On le remet donc.
        */

        agentId.value =
            id;


        await chargerBulletins(
            id
        );


        await chargerStatistiques();


    } catch (error) {

        console.error(
            'Erreur ajout bulletin :',
            error
        );


        afficherMessage(
            messageBulletin,
            error.message,
            'erreur'
        );

    }

}


/* =====================================================
   CREER UN BULLETIN DE TEST
   ===================================================== */

async function creerBulletinTest() {

    const id =
        agentId
            ? agentId.value
            : '';


    const champAnnee =
        document.getElementById(
            'annee'
        );


    const champPeriode =
        document.getElementById(
            'periode'
        );


    const annee =
        champAnnee
            ? champAnnee.value
            : '';


    const periode =
        champPeriode
            ? champPeriode.value
            : '';


    if (!id) {

        afficherMessage(
            messageBulletin,
            'Veuillez sélectionner un agent.',
            'erreur'
        );

        return;

    }


    if (!annee) {

        afficherMessage(
            messageBulletin,
            'Veuillez renseigner l’année.',
            'erreur'
        );

        return;

    }


    try {

        const response =
            await fetch(
                '/api/admin/bulletins-test',
                {

                    method: 'POST',

                    credentials:
                        'same-origin',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({

                            agentId:
                                id,

                            annee:
                                Number(
                                    annee
                                ),

                            periode

                        })

                }
            );


        if (response.status === 401) {

            window.location.href =
                '/connexion-admin';

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                'Erreur lors de la création.'
            );

        }


        afficherMessage(
            messageBulletin,
            data.message ||
            'Bulletin de test ajouté.',
            'succes'
        );


        await chargerBulletins(
            id
        );


        await chargerStatistiques();


    } catch (error) {

        console.error(
            'Erreur bulletin test :',
            error
        );


        afficherMessage(
            messageBulletin,
            error.message,
            'erreur'
        );

    }

}


/* =====================================================
   INITIALISATION
   ===================================================== */

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        /*
           Récupération des éléments
           une fois le HTML complètement chargé.
        */

        formAgent =
            document.getElementById(
                'formAgent'
            );


        messageAgent =
            document.getElementById(
                'messageAgent'
            );


        formRechercheAdmin =
            document.getElementById(
                'formRechercheAdmin'
            );


        rechercheAdmin =
            document.getElementById(
                'rechercheAdmin'
            );


        resultatsAdmin =
            document.getElementById(
                'resultatsAdmin'
            );


        zoneActionAdmin =
            document.getElementById(
                'zoneActionAdmin'
            );


        sectionBulletin =
            document.getElementById(
                'sectionBulletin'
            );


        sectionModification =
            document.getElementById(
                'sectionModification'
            );


        formBulletin =
            document.getElementById(
                'formBulletin'
            );


        formModificationAgent =
            document.getElementById(
                'formModificationAgent'
            );


        agentId =
            document.getElementById(
                'agentId'
            );


        agentSelectionne =
            document.getElementById(
                'agentSelectionne'
            );


        listeBulletins =
            document.getElementById(
                'listeBulletins'
            );


        messageBulletin =
            document.getElementById(
                'messageBulletin'
            );


        messageModification =
            document.getElementById(
                'messageModification'
            );


        /* =================================================
           CACHER LA ZONE AU DEMARRAGE
           ================================================= */

        cacherSections();


        /* =================================================
           BOUTON DECONNEXION
           ================================================= */

        const btnDeconnexion =
            document.getElementById(
                'btnDeconnexion'
            );


        if (btnDeconnexion) {

            btnDeconnexion.addEventListener(
                'click',
                deconnecterAdmin
            );

        }


        /* =================================================
           CREATION AGENT
           ================================================= */

        if (formAgent) {

            formAgent.addEventListener(
                'submit',
                creerAgent
            );

        }


        /* =================================================
           RECHERCHE AGENT
           ================================================= */

        if (formRechercheAdmin) {

            formRechercheAdmin.addEventListener(
                'submit',
                rechercherAgent
            );

        }


        /* =================================================
           AJOUT BULLETIN
           ================================================= */

        if (formBulletin) {

            formBulletin.addEventListener(
                'submit',
                ajouterBulletin
            );

        }


        /* =================================================
           BULLETIN TEST
           ================================================= */

        const btnBulletinTest =
            document.getElementById(
                'btnBulletinTest'
            );


        if (btnBulletinTest) {

            btnBulletinTest.addEventListener(
                'click',
                creerBulletinTest
            );

        }


        /* =================================================
           FERMER BULLETINS
           ================================================= */

        const btnFermerBulletins =
            document.getElementById(
                'btnFermerBulletins'
            );


        if (btnFermerBulletins) {

            btnFermerBulletins.addEventListener(
                'click',
                fermerBulletins
            );

        }


        /* =================================================
           FERMER MODIFICATION
           ================================================= */

        const btnFermerModification =
            document.getElementById(
                'btnFermerModification'
            );


        if (btnFermerModification) {

            btnFermerModification.addEventListener(
                'click',
                fermerModification
            );

        }


        /* =================================================
           ANNULER MODIFICATION
           ================================================= */

        const btnAnnulerModification =
            document.getElementById(
                'btnAnnulerModification'
            );


        if (btnAnnulerModification) {

            btnAnnulerModification.addEventListener(
                'click',
                fermerModification
            );

        }


        /* =================================================
           ENREGISTRER MODIFICATION
           ================================================= */

        if (formModificationAgent) {

            formModificationAgent.addEventListener(
                'submit',
                enregistrerModification
            );

        }


        /* =================================================
           ACTUALISER STATISTIQUES
           ================================================= */

        const btnActualiserStatistiques =
            document.getElementById(
                'btnActualiserStatistiques'
            );


        if (btnActualiserStatistiques) {

            btnActualiserStatistiques.addEventListener(
                'click',
                chargerStatistiques
            );

        }


        /* =================================================
           VERIFICATION SESSION
           ================================================= */

        const authentifie =
            await verifierSessionAdmin();


        if (!authentifie) {
            return;
        }


        /* =================================================
           CHARGER STATISTIQUES
           ================================================= */

        await chargerStatistiques();

    }
);