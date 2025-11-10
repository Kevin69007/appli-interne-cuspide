# Évolutions IA pour les Réunions

## Phase 1 (Actuelle) - Implémentée ✅

### Fonctionnalités de base
- ✅ Enregistrement audio en direct avec chronomètre
- ✅ Marquage temporel (timestamps) pendant l'enregistrement
- ✅ Association des timestamps à des projets et tâches spécifiques
- ✅ Notes contextuelles sur chaque timestamp
- ✅ Lecteur audio intelligent avec navigation par timestamps
- ✅ Affichage des réunions par projet avec points abordés
- ✅ Traçabilité complète : voir quand et où un projet a été discuté

### Analyse IA existante
- ✅ Transcription automatique via OpenAI Whisper (audio → texte)
- ✅ Résumé IA global de la réunion via GPT-4
- ✅ Extraction automatique des décisions prises

## Phase 2 - Analyse Contextuelle des Segments (À développer)

### Objectif
Analyser intelligemment chaque segment de réunion marqué pour extraire automatiquement les actions, décisions et suggestions concernant les projets et tâches spécifiques.

### Fonctionnalités prévues

#### 1. Analyse par segment
Pour chaque timestamp marqué (projet/tâche) :
- **Extraction du contexte audio**
  - Récupérer le segment audio ±30 secondes autour du timestamp
  - Transcrire spécifiquement ce segment avec Whisper
  - Conserver le lien avec le projet/tâche associé

- **Analyse IA contextuelle** (GPT-4)
  - Fournir le contexte du projet et de la tâche à l'IA
  - Identifier les actions concrètes mentionnées
  - Détecter si la tâche est mentionnée comme terminée/à clôturer
  - Extraire les obstacles ou problèmes soulevés
  - Identifier les nouvelles tâches à créer
  - Détecter les changements de priorité ou d'échéance

#### 2. Actions automatiques suggérées

**Sur les tâches existantes :**
- ✨ Ajouter automatiquement un commentaire résumant ce qui a été dit
- ✨ Proposer la clôture si la tâche est mentionnée comme terminée
- ✨ Suggérer une mise à jour du statut (en cours, bloquée, etc.)
- ✨ Proposer une modification de la date d'échéance si mentionnée
- ✨ Suggérer un changement de priorité

**Sur les projets :**
- ✨ Mettre à jour automatiquement la progression estimée
- ✨ Ajouter des notes de contexte au projet
- ✨ Créer des rappels pour les prochaines étapes
- ✨ Identifier les dépendances entre projets

**Création de nouvelles tâches :**
- ✨ Suggérer la création de tâches basées sur les actions identifiées
- ✨ Pré-remplir le titre, la description et les informations clés
- ✨ Proposer un assigné et une échéance
- ✨ Lier automatiquement au projet concerné

**Notifications et rappels :**
- ✨ Créer des notifications pour les personnes mentionnées
- ✨ Générer des rappels automatiques pour les actions à mener
- ✨ Alerter si une action urgente est identifiée

#### 3. Interface utilisateur prévue

**Vue "Suggestions IA" dans chaque réunion :**
```
┌─────────────────────────────────────────────────┐
│ 💡 Suggestions IA (12 nouvelles)                │
├─────────────────────────────────────────────────┤
│                                                  │
│ [25:34] Projet : Refonte Site Web               │
│ └─ Tâche : Design Page Accueil                 │
│                                                  │
│ L'IA suggère :                                   │
│ ✓ Ajouter commentaire : "Validation du mockup   │
│   par le client prévue vendredi"                │
│ ✓ Créer tâche : "Intégrer les retours client    │
│   sur le mockup"                                 │
│ ✓ Modifier échéance : du 15/02 au 22/02         │
│                                                  │
│ [Valider tout] [Modifier] [Ignorer]             │
└─────────────────────────────────────────────────┘
```

**Validation manuelle obligatoire :**
- Toutes les suggestions sont présentées pour validation
- Possibilité de modifier avant d'appliquer
- Historique des suggestions acceptées/refusées
- Apprentissage des préférences utilisateur

## Phase 3 - Analyse Prédictive (Vision future)

### Analyse des tendances
- 📊 Identifier les projets/tâches fréquemment bloqués
- 📊 Détecter les dépassements récurrents d'échéances
- 📊 Suggérer des réorganisations de priorités
- 📊 Prédire les goulots d'étranglement

### Synthèse intelligente
- 📋 Génération automatique de comptes-rendus structurés
- 📋 Création de rapports d'avancement par projet
- 📋 Résumés exécutifs pour la direction
- 📋 Suggestions d'ordre du jour pour la prochaine réunion

### Intégration avancée
- 🔗 Connexion avec calendriers externes
- 🔗 Synchronisation avec outils de gestion de projet externes
- 🔗 Export automatique vers documentation (Confluence, Notion, etc.)
- 🔗 Intégration avec messagerie (Slack, Teams) pour notifications

## Implémentation Technique Prévue

### Architecture

```
┌─────────────────────────────────────────────────┐
│ Edge Function: analyze-meeting-segment          │
├─────────────────────────────────────────────────┤
│                                                  │
│ Input:                                           │
│ - meeting_id                                     │
│ - timestamp_id                                   │
│ - audio_segment (±30s)                          │
│ - project_context                                │
│ - task_context                                   │
│                                                  │
│ Process:                                         │
│ 1. Transcription Whisper du segment             │
│ 2. Analyse GPT-4 avec contexte                  │
│ 3. Génération de suggestions structurées        │
│ 4. Stockage dans meeting_ai_suggestions          │
│                                                  │
│ Output:                                          │
│ - Actions suggérées                              │
│ - Nouvelles tâches proposées                     │
│ - Modifications recommandées                     │
└─────────────────────────────────────────────────┘
```

### Nouvelle table : `meeting_ai_suggestions`

```sql
CREATE TABLE meeting_ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp_id UUID REFERENCES meeting_timestamps(id),
  suggestion_type TEXT NOT NULL, -- 'comment', 'new_task', 'update_task', 'close_task'
  target_type TEXT, -- 'task', 'project'
  target_id UUID,
  suggestion_data JSONB NOT NULL, -- Données structurées de la suggestion
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'modified', 'rejected'
  applied_at TIMESTAMP,
  applied_by UUID,
  confidence_score DECIMAL(3,2), -- Score de confiance de l'IA
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Prompt Engineering

Le prompt pour l'analyse contextuelle inclura :
- Le contexte complet du projet (titre, description, statut, échéance)
- Le contexte de la tâche si applicable (titre, description, statut, assigné)
- La transcription du segment audio
- L'historique récent des actions sur ce projet/tâche
- Les instructions pour identifier : actions, décisions, changements, obstacles

### Considérations de coûts
- Utilisation ciblée de Whisper (seulement segments marqués)
- GPT-4 uniquement sur segments pertinents
- Système de cache pour éviter de re-analyser
- Option de désactivation de l'analyse IA si budget limité

## Timeline de Développement Estimée

### Phase 2 (Analyse Contextuelle) : 3-4 semaines
- Semaine 1 : Infrastructure (edge function, tables, API)
- Semaine 2 : Logique d'analyse IA et génération de suggestions
- Semaine 3 : Interface utilisateur de validation
- Semaine 4 : Tests et optimisations

### Phase 3 (Analyse Prédictive) : 4-6 semaines
- À définir selon les retours de la Phase 2

## Métriques de Succès

Pour mesurer l'efficacité de ces évolutions :
- ⏱️ Temps gagné sur la rédaction de comptes-rendus
- ✅ Taux d'acceptation des suggestions IA
- 📈 Augmentation du taux de complétion des tâches
- 🎯 Amélioration de la traçabilité projet/réunion
- 😊 Satisfaction utilisateur sur l'outil de réunion

---

**Note :** Ce document est évolutif et sera mis à jour au fur et à mesure de l'avancement du développement et des retours utilisateurs.
