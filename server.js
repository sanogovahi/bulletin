'use strict';

import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

import './backend/firebase.js';

import publicRoutes from './backend/routes/public.js';
import adminRoutes from './backend/routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT || 3000;

/* =====================================================
   IDENTIFIANTS ADMINISTRATEUR
   =====================================================

   MODIFIE CES DEUX VALEURS SI TU LE SOUHAITES.
*/
const ADMIN_IDENTIFIANT = 'admin';
const ADMIN_MOT_DE_PASSE = 'Admin@2026';

/* =====================================================
   SESSIONS ADMIN
   ===================================================== */

const sessionsAdmin = new Map();

function creerSessionAdmin() {

    const token =
        crypto.randomBytes(32).toString('hex');

    sessionsAdmin.set(token, {
        creeeLe: Date.now()
    });

    return token;
}

function supprimerSessionAdmin(token) {

    if (token) {
        sessionsAdmin.delete(token);
    }
}

function estAuthentifie(req) {

    const token =
        req.headers.cookie
            ?.split(';')
            .map(cookie => cookie.trim())
            .find(cookie =>
                cookie.startsWith('admin_session=')
            )
            ?.split('=')[1];

    if (!token) {
        return false;
    }

    return sessionsAdmin.has(token);
}

/* =====================================================
   MIDDLEWARE
   ===================================================== */

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

/* =====================================================
   FICHIERS PUBLICS
   ===================================================== */

app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);

/* =====================================================
   API PUBLIQUE
   ===================================================== */

app.use(
    '/api/public',
    publicRoutes
);

/* =====================================================
   PAGE DE CONNEXION ADMIN
   ===================================================== */

app.get(
    '/connexion-admin',
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                'public',
                'connexion-admin.html'
            )
        );

    }
);

/* =====================================================
   CONNEXION ADMIN
   ===================================================== */

app.post(
    '/api/admin-login',
    (req, res) => {

        const {
            identifiant,
            motDePasse
        } = req.body;

        if (
            !identifiant ||
            !motDePasse
        ) {

            return res.status(400).json({
                success: false,
                message:
                    'Veuillez renseigner l’identifiant et le mot de passe.'
            });

        }

        if (
            identifiant !== ADMIN_IDENTIFIANT ||
            motDePasse !== ADMIN_MOT_DE_PASSE
        ) {

            return res.status(401).json({
                success: false,
                message:
                    'Identifiant ou mot de passe incorrect.'
            });

        }

        const token =
            creerSessionAdmin();

        res.setHeader(
            'Set-Cookie',
            `admin_session=${token}; HttpOnly; Path=/; SameSite=Lax`
        );

        return res.json({
            success: true,
            message:
                'Connexion administrateur réussie.'
        });

    }
);

/* =====================================================
   VERIFICATION SESSION ADMIN
   ===================================================== */

app.get(
    '/api/admin-session',
    (req, res) => {

        if (!estAuthentifie(req)) {

            return res.status(401).json({
                success: false,
                message:
                    'Session administrateur inexistante.'
            });

        }

        return res.json({
            success: true,
            authentifie: true
        });

    }
);

/* =====================================================
   DECONNEXION ADMIN
   ===================================================== */

app.post(
    '/api/admin-logout',
    (req, res) => {

        const cookies =
            req.headers.cookie || '';

        const cookie =
            cookies
                .split(';')
                .map(item => item.trim())
                .find(item =>
                    item.startsWith(
                        'admin_session='
                    )
                );

        if (cookie) {

            const token =
                cookie
                    .split('=')
                    .slice(1)
                    .join('=');

            supprimerSessionAdmin(token);

        }

        res.setHeader(
            'Set-Cookie',
            'admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
        );

        return res.json({
            success: true,
            message:
                'Déconnexion réussie.'
        });

    }
);

/* =====================================================
   PAGE ADMINISTRATION
   ===================================================== */

app.get(
    '/administration',
    (req, res) => {

        if (!estAuthentifie(req)) {

            return res.redirect(
                '/connexion-admin'
            );

        }

        return res.sendFile(
            path.join(
                __dirname,
                'public',
                'administration.html'
            )
        );

    }
);

/* =====================================================
   API ADMINISTRATEUR
   ===================================================== */

app.use(
    '/api/admin',
    (req, res, next) => {

        if (!estAuthentifie(req)) {

            return res.status(401).json({
                success: false,
                message:
                    'Accès administrateur non autorisé.'
            });

        }

        next();

    },
    adminRoutes
);

/* =====================================================
   PAGE PUBLIQUE
   ===================================================== */

app.get(
    '/',
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                'public',
                'index.html'
            )
        );

    }
);

/* =====================================================
   GESTION DES ERREURS
   ===================================================== */

app.use(
    (err, req, res, next) => {

        console.error(
            'Erreur serveur :',
            err
        );

        res.status(500).json({
            success: false,
            message:
                err.message ||
                'Erreur interne du serveur.'
        });

    }
);

/* =====================================================
   DEMARRAGE
   ===================================================== */

app.listen(
    PORT,
    () => {

        console.log('');
        console.log(
            '======================================'
        );
        console.log(
            '   PORTAIL BULLETINS DE NOTES'
        );
        console.log(
            '======================================'
        );
        console.log('');

        console.log(
            `🌐 Consultation : http://localhost:${PORT}`
        );

        console.log(
            `🔐 Administration : http://localhost:${PORT}/administration`
        );

        console.log(
            `🔑 Connexion admin : http://localhost:${PORT}/connexion-admin`
        );

        console.log('');

    }
);