import express from 'express';
import { firestore } from '../firebase.js';

const routes = express.Router();

/*
 * Vérification de l'API
 */
routes.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API publique opérationnelle'
  });
});

/*
 * Recherche d'un agent
 *
 * Exemple :
 * /api/public/recherche?nom=KOUASSI&mecano=12345
 */
routes.get('/recherche', async (req, res) => {

  try {

    const nom = String(
      req.query.nom || ''
    ).trim();

    const mecano = String(
      req.query.mecano || ''
    ).trim();

    if (!nom || !mecano) {

      return res.status(400).json({
        success: false,
        message:
          'Le nom et le mécano sont obligatoires.'
      });

    }

    const nomNormalise =
      nom.toLowerCase();

    const mecanoNormalise =
      mecano.toLowerCase();

    /*
     * Recherche de l'agent
     */
    const agentSnapshot =
      await firestore
        .collection('agents')
        .where(
          'nomNormalise',
          '==',
          nomNormalise
        )
        .where(
          'mecanoNormalise',
          '==',
          mecanoNormalise
        )
        .limit(1)
        .get();

    if (agentSnapshot.empty) {

      return res.json({
        success: true,
        agent: null,
        message:
          'Aucun agent trouvé.'
      });

    }

    const agentDoc =
      agentSnapshot.docs[0];

    const agent = {
      id: agentDoc.id,
      ...agentDoc.data()
    };

    /*
     * Récupération de tous les bulletins
     */
    const bulletinsSnapshot =
      await firestore
        .collection('bulletins')
        .where(
          'agentId',
          '==',
          agentDoc.id
        )
        .get();

    const bulletins =
      bulletinsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort(
          (a, b) =>
            Number(b.annee) -
            Number(a.annee)
        );

    /*
     * On ne transmet pas les champs
     * techniques de recherche
     */
    delete agent.nomNormalise;
    delete agent.mecanoNormalise;

    return res.json({

      success: true,

      agent,

      bulletins

    });

  } catch (error) {

    console.error(
      'Erreur recherche agent :',
      error
    );

    return res.status(500).json({

      success: false,

      message:
        'Erreur lors de la recherche.'

    });

  }

});

export default routes;