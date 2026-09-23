This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Déploiement sur Dokploy

Eventos utilise Supabase comme backend (auth, base de données, storage) — Dokploy n'héberge que l'application Next.js elle-même, pas de base de données séparée à créer.

1. Dans Dokploy, crée un nouveau **Project**, puis à l'intérieur une nouvelle **Application** de type **Docker**, connectée au dépôt GitHub `amadougeoffroy/eventos` (branche `main`). Le `Dockerfile` à la racine est détecté automatiquement.
2. Dans la section **Build Args** (variables disponibles au moment du build, pas seulement à l'exécution), renseigne :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   C'est nécessaire car ces deux valeurs sont injectées dans le bundle JavaScript envoyé au navigateur au moment du build, pas lues dynamiquement au démarrage.
3. Dans la section **Environment Variables** (runtime), renseigne les variables de `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `BREVO_API_KEY` (clé API Brevo, pour l'envoi du lien d'invitation par email depuis le dashboard)
   - `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` (optionnel — adresse et nom d'expéditeur, doivent correspondre à un expéditeur vérifié dans Brevo)
4. Expose le port `3000` (celui écouté par le serveur `standalone`).
5. Configure ton domaine (ex: `eventos.tondomaine.com`) dans l'onglet **Domains**, Dokploy génère le certificat SSL automatiquement via Let's Encrypt.
6. Lance le déploiement. Les futurs `git push` sur `main` peuvent déclencher un redéploiement automatique si tu actives le webhook proposé par Dokploy.

### Build local de l'image Docker (pour vérifier avant de déployer)

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=xxx \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx \
  -t eventos .
docker run --rm -p 3000:3000 --env-file .env.local eventos
```
