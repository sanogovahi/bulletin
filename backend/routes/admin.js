'use strict';

import express from 'express';
import multer from 'multer';
import { firestore, bucket } from '../firebase.js';

const router = express.Router();

/* =====================================================
   OUTILS
   ===================================================== */

/* =====================================================
   UPLOAD DES BULLETINS
   ===================================================== */

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const autorises = [
            'application/pdf',
            'image/jpeg',
            'image/png'
        ];

        if (!autorises.includes(file.mimetype)) {
            return cb(new Error('Format de fichier non autorisé. Utilisez PDF, JPG, JPEG ou PNG.'));
        }

        cb(null, true);
    }
});

function normaliserMecano(valeur) {
    return String(valeur || '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '');
}


function envoyerErreur(res, error, message = 'Une erreur est survenue.') {
    console.error(message, error);

    return res.status(500).json({
        success: false,
        message: error?.message || message
    });
}

/* =====================================================
   TEST API ADMIN
   ===================================================== */

router.get('/test', (req, res) => {
    return res.json({
        success: true,
        message: 'API administration opérationnelle.'
    });
});

/* =====================================================
   STATISTIQUES
   ===================================================== */

router.get('/statistiques', async (req, res) => {
    try {
        const snapshot = await firestore
            .collection('bulletins')
            .get();

        const compteurs = {};

        snapshot.forEach((doc) => {
            const bulletin = doc.data();

            const annee = String(
                bulletin.annee ?? 'Non renseignée'
            );

            compteurs[annee] =
                (compteurs[annee] || 0) + 1;
        });

        const annees = Object.entries(compteurs)
            .map(([annee, nombre]) => ({
                annee,
                nombre
            }))
            .sort((a, b) =>
                String(b.annee).localeCompare(
                    String(a.annee)
                )
            );

        return res.json({
            success: true,
            total: snapshot.size,
            annees
        });

    } catch (error) {
        return envoyerErreur(
            res,
            error,
            'Erreur lors du chargement des statistiques.'
        );
    }
});

/* =====================================================
   CREER UN AGENT
   ===================================================== */

router.post('/agents', async (req, res) => {
    try {
        const {
            nom,
            prenom,
            mecano,
            service,
            grade,
            fonction
        } = req.body;

        if (
            !nom ||
            !prenom ||
            !mecano
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'Le nom, le prénom et le mécano sont obligatoires.'
            });
        }

        const mecanoNormalise = normaliserMecano(mecano);

        /* Le mécano est une clé individuelle : aucun doublon autorisé. */
        const agentsExistants = await firestore
            .collection('agents')
            .get();

        const doublon = agentsExistants.docs.find(doc =>
            normaliserMecano(doc.data().mecano) === mecanoNormalise
        );

        if (doublon) {
            const agentExistant = doublon.data();
            return res.status(409).json({
                success: false,
                message: `Ce mécano (${String(mecano).trim()}) est déjà attribué à ${agentExistant.nom || ''} ${agentExistant.prenom || ''}. Un mécano ne peut être attribué qu'à un seul agent.`,
                agentId: doublon.id
            });
        }

        const agent = {
            nom: String(nom).trim(),
            prenom: String(prenom).trim(),
            mecano: String(mecano).trim(),
            mecanoNormalise,
            service: String(service || '').trim(),
            grade: String(grade || '').trim(),
            fonction: String(fonction || '').trim(),
            createdAt: new Date()
        };

        const reference =
            await firestore
                .collection('agents')
                .add(agent);

        return res.status(201).json({
            success: true,
            id: reference.id,
            message:
                'Agent enregistré avec succès.'
        });

    } catch (error) {
        return envoyerErreur(
            res,
            error,
            'Erreur lors de la création de l’agent.'
        );
    }
});

/* =====================================================
   RECHERCHE AGENT
   ===================================================== */

router.get('/agents/recherche', async (req, res) => {
    try {
        const recherche =
            String(
                req.query.recherche || ''
            )
                .trim()
                .toLowerCase();

        if (!recherche) {
            return res.json({
                success: true,
                agents: []
            });
        }

        const snapshot =
            await firestore
                .collection('agents')
                .get();

        const agents = [];

        snapshot.forEach((doc) => {
            const agent = doc.data();

            const texte = [
                agent.nom,
                agent.prenom,
                agent.mecano,
                agent.service,
                agent.grade,
                agent.fonction
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            if (texte.includes(recherche)) {
                agents.push({
                    id: doc.id,
                    ...agent
                });
            }
        });

        agents.sort((a, b) => {
            const nomA =
                `${a.nom || ''} ${a.prenom || ''}`;

            const nomB =
                `${b.nom || ''} ${b.prenom || ''}`;

            return nomA.localeCompare(
                nomB,
                'fr',
                {
                    sensitivity: 'base'
                }
            );
        });

        return res.json({
            success: true,
            agents
        });

    } catch (error) {
        return envoyerErreur(
            res,
            error,
            'Erreur lors de la recherche des agents.'
        );
    }
});

/* =====================================================
   MODIFIER UN AGENT
   ===================================================== */

router.put('/agents/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Identifiant agent manquant.'
            });
        }

        const {
            nom,
            prenom,
            mecano,
            service,
            grade,
            fonction
        } = req.body;

        const reference =
            firestore
                .collection('agents')
                .doc(id);

        const document =
            await reference.get();

        if (!document.exists) {
            return res.status(404).json({
                success: false,
                message: 'Agent introuvable.'
            });
        }

        if (!nom || !prenom || !mecano) {
            return res.status(400).json({
                success: false,
                message: 'Le nom, le prénom et le mécano sont obligatoires.'
            });
        }

        const mecanoNormalise = normaliserMecano(mecano);
        const agentsExistants = await firestore.collection('agents').get();
        const doublon = agentsExistants.docs.find(doc =>
            doc.id !== id && normaliserMecano(doc.data().mecano) === mecanoNormalise
        );

        if (doublon) {
            const agentExistant = doublon.data();
            return res.status(409).json({
                success: false,
                message: `Impossible de modifier cet agent : le mécano ${String(mecano).trim()} est déjà attribué à ${agentExistant.nom || ''} ${agentExistant.prenom || ''}.`,
                agentId: doublon.id
            });
        }

        await reference.update({
            nom: String(nom).trim(),
            prenom: String(prenom).trim(),
            mecano: String(mecano).trim(),
            mecanoNormalise,
            service: String(service || '').trim(),
            grade: String(grade || '').trim(),
            fonction: String(fonction || '').trim(),
            updatedAt: new Date()
        });

        return res.json({
            success: true,
            message:
                'Agent modifié avec succès.'
        });

    } catch (error) {
        return envoyerErreur(
            res,
            error,
            'Erreur lors de la modification de l’agent.'
        );
    }
});

/* =====================================================
   BULLETINS D'UN AGENT
   ===================================================== */

router.get(
    '/agents/:id/bulletins',
    async (req, res) => {
        try {
            const agentId =
                req.params.id;

            if (!agentId) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Identifiant agent manquant.'
                });
            }

            const snapshot =
                await firestore
                    .collection('bulletins')
                    .where(
                        'agentId',
                        '==',
                        agentId
                    )
                    .get();

            const bulletins = [];

            snapshot.forEach((doc) => {
                bulletins.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            bulletins.sort((a, b) => {
                const anneeA =
                    Number(a.annee || 0);

                const anneeB =
                    Number(b.annee || 0);

                return anneeB - anneeA;
            });

            return res.json({
                success: true,
                bulletins
            });

        } catch (error) {
            return envoyerErreur(
                res,
                error,
                'Impossible de charger les bulletins.'
            );
        }
    }
);

/* =====================================================
   AJOUTER UN BULLETIN
   ===================================================== */

router.post('/bulletins', upload.single('bulletin'), async (req, res) => {
    try {
        const {
            agentId,
            annee,
            periode
        } = req.body;

        if (!agentId) {
            return res.status(400).json({
                success: false,
                message:
                    'Agent non sélectionné.'
            });
        }

        if (!annee) {
            return res.status(400).json({
                success: false,
                message:
                    'L’année est obligatoire.'
            });
        }

        const agentReference =
            firestore
                .collection('agents')
                .doc(agentId);

        const agent =
            await agentReference.get();

        if (!agent.exists) {
            return res.status(404).json({
                success: false,
                message:
                    'Agent introuvable.'
            });
        }

        const periodeNormalisee = String(periode || 'Annuelle').trim();

        const doublonBulletin = await firestore
            .collection('bulletins')
            .where('agentId', '==', agentId)
            .where('annee', '==', Number(annee))
            .where('periode', '==', periodeNormalisee)
            .get();

        if (!doublonBulletin.empty) {
            return res.status(409).json({
                success: false,
                message: `Un bulletin existe déjà pour cet agent pour l'année ${annee} (${periodeNormalisee}).`
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Veuillez sélectionner le fichier du bulletin.'
            });
        }

        const nomFichier = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const cheminStockage = `bulletins/${agentId}/${nomFichier}`;
        const fichierStorage = bucket.file(cheminStockage);

        await fichierStorage.save(req.file.buffer, {
            metadata: {
                contentType: req.file.mimetype,
                metadata: {
                    agentId,
                    annee: String(annee),
                    periode: periodeNormalisee
                }
            }
        });

        const bulletin = {
            agentId,
            annee: Number(annee),
            periode: periodeNormalisee,
            test: false,
            fichier: true,
            storagePath: cheminStockage,
            nomFichier: req.file.originalname,
            typeFichier: req.file.mimetype,
            tailleFichier: req.file.size,
            createdAt: new Date()
        };

        const reference =
            await firestore
                .collection('bulletins')
                .add(bulletin);

        return res.status(201).json({
            success: true,
            id: reference.id,
            message:
                'Bulletin enregistré avec succès.'
        });

    } catch (error) {
        return envoyerErreur(
            res,
            error,
            'Erreur lors de l’enregistrement du bulletin.'
        );
    }
});

/* =====================================================
   CREER UN BULLETIN DE TEST
   ===================================================== */

router.post(
    '/bulletins-test',
    async (req, res) => {
        try {
            const {
                agentId,
                annee,
                periode
            } = req.body;

            if (!agentId) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Agent non sélectionné.'
                });
            }

            if (!annee) {
                return res.status(400).json({
                    success: false,
                    message:
                        'L’année est obligatoire.'
                });
            }

            const agentReference =
                firestore
                    .collection('agents')
                    .doc(agentId);

            const agent =
                await agentReference.get();

            if (!agent.exists) {
                return res.status(404).json({
                    success: false,
                    message:
                        'Agent introuvable.'
                });
            }

            const bulletin = {
                agentId,
                annee: Number(annee),
                periode:
                    String(
                        periode || 'Annuelle'
                    ),
                test: true,
                fichier: false,
                createdAt: new Date()
            };

            const reference =
                await firestore
                    .collection('bulletins')
                    .add(bulletin);

            return res.status(201).json({
                success: true,
                id: reference.id,
                message:
                    'Bulletin de test ajouté.'
            });

        } catch (error) {
            return envoyerErreur(
                res,
                error,
                'Erreur lors de la création du bulletin de test.'
            );
        }
    }
);

/* =====================================================
   VOIR UN BULLETIN
   ===================================================== */

router.get(
    '/bulletins/:id/voir',
    async (req, res) => {
        try {
            const id =
                req.params.id;

            const reference =
                firestore
                    .collection('bulletins')
                    .doc(id);

            const document =
                await reference.get();

            if (!document.exists) {
                return res.status(404).send(
                    'Bulletin introuvable.'
                );
            }

            const bulletin =
                document.data();

            if (!bulletin.fichier || !bulletin.storagePath) {
                return res.status(404).send(
                    'Aucun fichier associé à ce bulletin.'
                );
            }

            const fichier = bucket.file(bulletin.storagePath);
            const [existe] = await fichier.exists();

            if (!existe) {
                return res.status(404).send('Le fichier du bulletin est introuvable dans le stockage.');
            }

            const [url] = await fichier.getSignedUrl({
                action: 'read',
                expires: Date.now() + 15 * 60 * 1000
            });

            return res.redirect(url);

        } catch (error) {
            console.error(
                'Erreur affichage bulletin :',
                error
            );

            return res.status(500).send(
                'Erreur lors de l’affichage du bulletin.'
            );
        }
    }
);

/* =====================================================
   SUPPRIMER UN BULLETIN
   ===================================================== */

router.delete(
    '/bulletins/:id',
    async (req, res) => {
        try {
            const id =
                req.params.id;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Identifiant bulletin manquant.'
                });
            }

            const reference =
                firestore
                    .collection('bulletins')
                    .doc(id);

            const document =
                await reference.get();

            if (!document.exists) {
                return res.status(404).json({
                    success: false,
                    message:
                        'Bulletin introuvable.'
                });
            }

            const bulletin = document.data();

            if (bulletin.storagePath) {
                try {
                    await bucket.file(bulletin.storagePath).delete({ ignoreNotFound: true });
                } catch (storageError) {
                    console.error('Erreur suppression fichier Storage :', storageError);
                }
            }

            await reference.delete();

            return res.json({
                success: true,
                message:
                    'Bulletin supprimé avec succès.'
            });

        } catch (error) {
            return envoyerErreur(
                res,
                error,
                'Impossible de supprimer le bulletin.'
            );
        }
    }
);

/* =====================================================
   EXPORT
   ===================================================== */

export default router;