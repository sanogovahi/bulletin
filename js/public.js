const formRecherche =
    document.getElementById('formRecherche');

const messageRecherche =
    document.getElementById('messageRecherche');

const resultats =
    document.getElementById('resultats');


formRecherche.addEventListener(
    'submit',
    async (event) => {

        event.preventDefault();


        const nom =
            document
                .getElementById('nom')
                .value
                .trim();

        const mecano =
            document
                .getElementById('mecano')
                .value
                .trim();


        if (!nom || !mecano) {

            afficherMessage(
                'Veuillez renseigner votre nom et votre mécano.',
                'erreur'
            );

            return;

        }


        afficherMessage(
            'Recherche en cours...',
            'normal'
        );

        resultats.innerHTML = '';


        try {

            const url =
                `/api/public/recherche?nom=${encodeURIComponent(nom)}&mecano=${encodeURIComponent(mecano)}`;


            const response =
                await fetch(url);


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    'Erreur lors de la recherche.'
                );

            }


            if (!data.agent) {

                afficherMessage(
                    'Aucun agent ne correspond aux informations renseignées.',
                    'erreur'
                );

                return;

            }


            afficherMessage(
                'Agent trouvé.',
                'succes'
            );


            afficherAgent(
                data.agent,
                data.bulletins || []
            );


        } catch (error) {

            console.error(error);

            afficherMessage(
                error.message,
                'erreur'
            );

        }

    }
);


/* ==========================================
   AFFICHER L'AGENT
========================================== */

function afficherAgent(
    agent,
    bulletins
) {

    const bloc =
        document.createElement('section');

    bloc.className =
        'carte agent-public';


    bloc.innerHTML = `

        <div class="agent-entete">

            <div>

                <h2>
                    ${escapeHtml(agent.nom)}
                    ${escapeHtml(agent.prenom)}
                </h2>

                <p>
                    Mécano :
                    <strong>
                        ${escapeHtml(agent.mecano)}
                    </strong>
                </p>

            </div>

        </div>


        <div class="informations-agent">

            <div>
                <span>Service</span>
                <strong>
                    ${escapeHtml(agent.service || '-')}
                </strong>
            </div>

            <div>
                <span>Grade</span>
                <strong>
                    ${escapeHtml(agent.grade || '-')}
                </strong>
            </div>

            <div>
                <span>Fonction</span>
                <strong>
                    ${escapeHtml(agent.fonction || '-')}
                </strong>
            </div>

        </div>


        <div class="bulletins">

            <h3>
                Mes bulletins de notes
            </h3>

            <div id="listeBulletinsPublic"></div>

        </div>

    `;


    resultats.innerHTML = '';

    resultats.appendChild(bloc);


    const liste =
        bloc.querySelector(
            '#listeBulletinsPublic'
        );


    afficherBulletins(
        liste,
        bulletins
    );

}


/* ==========================================
   AFFICHER LES BULLETINS PAR ANNEE
========================================== */

function afficherBulletins(
    conteneur,
    bulletins
) {

    if (!bulletins.length) {

        conteneur.innerHTML = `

            <div class="aucun-bulletin">

                <p>
                    Aucun bulletin n'est actuellement
                    disponible.
                </p>

            </div>

        `;

        return;

    }


    /*
     * Tri du plus récent au plus ancien
     */

    bulletins.sort(
        (a, b) =>
            Number(b.annee) -
            Number(a.annee)
    );


    bulletins.forEach(
        bulletin => {

            const ligne =
                document.createElement('div');

            ligne.className =
                'bulletin-public';


            ligne.innerHTML = `

                <div class="annee">

                    <strong>
                        ${escapeHtml(
                            String(bulletin.annee)
                        )}
                    </strong>

                </div>


                <div class="periode">

                    ${escapeHtml(
                        bulletin.periode ||
                        'Annuelle'
                    )}

                </div>


                <div class="action-bulletin">

                    ${
                        bulletin.id
                            ? `
                                <a
                                    href="/api/admin/bulletins/${encodeURIComponent(bulletin.id)}/voir"
                                    target="_blank"
                                >
                                    Consulter
                                </a>
                              `
                            : `
                                <span>
                                    Bulletin disponible
                                </span>
                              `
                    }

                </div>

            `;


            conteneur.appendChild(
                ligne
            );

        }
    );

}


/* ==========================================
   MESSAGE
========================================== */

function afficherMessage(
    message,
    type
) {

    messageRecherche.textContent =
        message;

    messageRecherche.className =
        `message ${type}`;

}


/* ==========================================
   PROTECTION HTML
========================================== */

function escapeHtml(
    valeur
) {

    return String(
        valeur ?? ''
    )
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );

}