import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

/* =====================================================
   CONFIGURATION FIREBASE
===================================================== */

const cheminCle = path.join(
    process.cwd(),
    'firebase-service-account.json'
);

/* Vérification de la clé Firebase */

if (!fs.existsSync(cheminCle)) {
    throw new Error(
        'Le fichier firebase-service-account.json est introuvable.'
    );
}

/* Lecture de la clé */

const compteService = JSON.parse(
    fs.readFileSync(cheminCle, 'utf8')
);

/* =====================================================
   INITIALISATION FIREBASE
===================================================== */

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(compteService),
        storageBucket: 'bulletins-8dd4d.firebasestorage.app'
    });
}

/* =====================================================
   SERVICES FIREBASE
===================================================== */

export const firestore =
    admin.firestore();

export const auth =
    admin.auth();

export const bucket =
    admin.storage().bucket();

/* =====================================================
   VERIFICATION
===================================================== */

console.log(
    '✅ Firebase connecté :',
    compteService.project_id
);

console.log(
    '🪣 Storage :',
    bucket.name
);