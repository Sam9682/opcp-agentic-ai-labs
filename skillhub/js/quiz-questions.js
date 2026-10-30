/**
 * SkillHub Section I quiz question bank.
 *
 * Exactly 15 bilingual (English/French) multiple-choice questions whose subject
 * matter is drawn from the Section I lessons (Fundamentals & Governance):
 * assistant-vs-agent, agent-anatomy-7-components, agentic-loop-and-variants,
 * stopping-criteria, multi-agent-patterns, when-not-multi-agent,
 * guardrails-5-layers, human-in-the-loop-ovhcloud-policy,
 * threat-modeling-workshop, agent-design-capstone, and
 * configuring-shai-mcp-opcp-explorer.
 *
 * Each question carries a stable `id`, a bilingual `prompt`, at least two
 * bilingual `options`, and exactly one `correctIndex` identifying the correct
 * option. Scoring (in quiz.js) compares option indices only, so the bank is
 * locale-independent by construction.
 */

/**
 * A single selectable answer option, in both locales.
 *
 * @typedef {Object} QuizOption
 * @property {{en: string, fr: string}} text - Option label in English and French.
 */

/**
 * A single multiple-choice question, in both locales.
 *
 * @typedef {Object} QuizQuestion
 * @property {string} id                       stable question id
 * @property {{en: string, fr: string}} prompt question text, both locales
 * @property {QuizOption[]} options            >= 2 options
 * @property {number} correctIndex             index into options; exactly one correct
 */

/**
 * The Section I question bank: exactly 15 well-formed, fully bilingual questions.
 *
 * @type {QuizQuestion[]}
 */
export const QUIZ_QUESTIONS = [
  {
    id: 'assistant-vs-agent-loop-driver',
    prompt: {
      en: 'What is the core difference between an AI assistant and an AI agent?',
      fr: "Quelle est la différence fondamentale entre un assistant IA et un agent IA ?",
    },
    options: [
      {
        text: {
          en: 'An assistant responds to a single request and stops, while an agent drives its own loop to pursue a goal across many steps.',
          fr: "Un assistant répond à une seule requête puis s'arrête, tandis qu'un agent pilote sa propre boucle pour poursuivre un objectif sur plusieurs étapes.",
        },
      },
      {
        text: {
          en: 'An assistant always runs on a larger model than an agent.',
          fr: "Un assistant fonctionne toujours sur un modèle plus grand qu'un agent.",
        },
      },
      {
        text: {
          en: 'An agent can only answer questions, while an assistant takes actions.',
          fr: "Un agent ne peut que répondre à des questions, tandis qu'un assistant effectue des actions.",
        },
      },
    ],
    correctIndex: 0,
  },
  {
    id: 'autonomy-spectrum-least-autonomy',
    prompt: {
      en: 'According to the autonomy spectrum, how much autonomy should you grant an agent?',
      fr: "Selon le spectre d'autonomie, quel niveau d'autonomie faut-il accorder à un agent ?",
    },
    options: [
      {
        text: {
          en: 'Always the maximum, so the agent can finish faster.',
          fr: "Toujours le maximum, pour que l'agent termine plus vite.",
        },
      },
      {
        text: {
          en: 'The least autonomy that still lets the agent accomplish the task, matched with appropriate guardrails.',
          fr: "La plus faible autonomie permettant encore à l'agent d'accomplir la tâche, associée à des garde-fous appropriés.",
        },
      },
      {
        text: {
          en: 'Autonomy is binary, so you either grant full control or none.',
          fr: "L'autonomie est binaire : on accorde soit le contrôle total, soit aucun.",
        },
      },
    ],
    correctIndex: 1,
  },
  {
    id: 'anatomy-seven-components',
    prompt: {
      en: 'Which set lists the seven core components of an AI agent?',
      fr: "Quel ensemble énumère les sept composants de base d'un agent IA ?",
    },
    options: [
      {
        text: {
          en: 'Brain, short-term memory, long-term memory, tools, planner, execution loop, and guardrails.',
          fr: "Cerveau, mémoire à court terme, mémoire à long terme, outils, planificateur, boucle d'exécution et garde-fous.",
        },
      },
      {
        text: {
          en: 'Keyboard, screen, network, disk, CPU, GPU, and power supply.',
          fr: 'Clavier, écran, réseau, disque, processeur, carte graphique et alimentation.',
        },
      },
      {
        text: {
          en: 'Frontend, backend, database, cache, queue, load balancer, and CDN.',
          fr: 'Frontend, backend, base de données, cache, file, répartiteur de charge et CDN.',
        },
      },
    ],
    correctIndex: 0,
  },
  {
    id: 'anatomy-tools-role',
    prompt: {
      en: "In an agent's anatomy, what role do the tools play?",
      fr: "Dans l'anatomie d'un agent, quel rôle jouent les outils ?",
    },
    options: [
      {
        text: {
          en: 'They are the reasoning engine that decides the next step.',
          fr: 'Ils sont le moteur de raisonnement qui décide de la prochaine étape.',
        },
      },
      {
        text: {
          en: "They are the agent's hands — APIs, CLIs, functions, and MCP servers that let it affect the world.",
          fr: "Ils sont les mains de l'agent — API, CLI, fonctions et serveurs MCP qui lui permettent d'agir sur le monde.",
        },
      },
      {
        text: {
          en: 'They store persistent knowledge across sessions.',
          fr: 'Ils stockent les connaissances persistantes entre les sessions.',
        },
      },
    ],
    correctIndex: 1,
  },
  {
    id: 'agentic-loop-cycle',
    prompt: {
      en: 'What is the base agentic loop?',
      fr: "Quelle est la boucle agentique de base ?",
    },
    options: [
      {
        text: {
          en: 'Observe → Store → Forget, repeated once.',
          fr: 'Observer → Stocker → Oublier, répété une fois.',
        },
      },
      {
        text: {
          en: 'Think → Act → Observe, repeated until a stopping condition is met.',
          fr: "Penser → Agir → Observer, répété jusqu'à ce qu'une condition d'arrêt soit remplie.",
        },
      },
      {
        text: {
          en: 'Plan → Deploy → Delete, run exactly twice.',
          fr: 'Planifier → Déployer → Supprimer, exécuté exactement deux fois.',
        },
      },
    ],
    correctIndex: 1,
  },
  {
    id: 'loop-variant-reflexion',
    prompt: {
      en: 'Which agentic loop variant adds a self-critique step, writing a lesson to memory after a failed attempt and retrying with that insight?',
      fr: "Quelle variante de la boucle agentique ajoute une étape d'autocritique, consignant une leçon en mémoire après un échec puis réessayant avec cet apprentissage ?",
    },
    options: [
      {
        text: { en: 'ReAct', fr: 'ReAct' },
      },
      {
        text: { en: 'Plan-and-Execute', fr: 'Plan-and-Execute (planifier puis exécuter)' },
      },
      {
        text: { en: 'Reflexion', fr: 'Reflexion' },
      },
    ],
    correctIndex: 2,
  },
  {
    id: 'stopping-criteria-pairing',
    prompt: {
      en: 'What is the best practice for setting an agent’s stopping criteria?',
      fr: "Quelle est la bonne pratique pour définir les critères d'arrêt d'un agent ?",
    },
    options: [
      {
        text: {
          en: 'Rely on the goal-achieved condition alone, since it is the ideal stop.',
          fr: "Se fier uniquement à la condition d'objectif atteint, puisqu'elle constitue l'arrêt idéal.",
        },
      },
      {
        text: {
          en: 'Pair the goal condition with at least one hard limit (such as max iterations or a timeout) so the agent terminates even when the goal is unreachable.',
          fr: "Associer la condition d'objectif à au moins une limite stricte (comme un nombre maximal d'itérations ou un délai) afin que l'agent s'arrête même lorsque l'objectif est inatteignable.",
        },
      },
      {
        text: {
          en: 'Never set any limits, so the agent can keep retrying until it succeeds.',
          fr: "Ne jamais fixer de limites, pour que l'agent puisse réessayer jusqu'à réussir.",
        },
      },
    ],
    correctIndex: 1,
  },
  {
    id: 'multi-agent-four-patterns',
    prompt: {
      en: 'Which option lists the four multi-agent architectural patterns?',
      fr: 'Quelle option énumère les quatre patrons architecturaux multi-agents ?',
    },
    options: [
      {
        text: {
          en: 'Supervisor, pipeline, parallel, and network.',
          fr: 'Superviseur, pipeline, parallèle et réseau.',
        },
      },
      {
        text: {
          en: 'Monolith, microservice, serverless, and batch.',
          fr: 'Monolithe, microservice, sans serveur et par lots.',
        },
      },
      {
        text: {
          en: 'Client, server, proxy, and gateway.',
          fr: 'Client, serveur, proxy et passerelle.',
        },
      },
    ],
    correctIndex: 0,
  },
  {
    id: 'when-not-multi-agent-default',
    prompt: {
      en: 'What is the rule of thumb for choosing between a single agent and a multi-agent design?',
      fr: "Quelle est la règle empirique pour choisir entre un agent unique et une conception multi-agents ?",
    },
    options: [
      {
        text: {
          en: 'Always start with multiple agents, because specialization is free.',
          fr: 'Toujours commencer avec plusieurs agents, car la spécialisation est gratuite.',
        },
      },
      {
        text: {
          en: 'Start with one agent and split into multiple only when a concrete need — specialization, parallelism, or scope isolation — justifies the added cost.',
          fr: "Commencer avec un seul agent et ne passer à plusieurs que lorsqu'un besoin concret — spécialisation, parallélisme ou isolation des périmètres — justifie le coût supplémentaire.",
        },
      },
      {
        text: {
          en: 'The number of agents should always match the number of tools available.',
          fr: "Le nombre d'agents doit toujours correspondre au nombre d'outils disponibles.",
        },
      },
    ],
    correctIndex: 1,
  },
  {
    id: 'multi-agent-hidden-cost',
    prompt: {
      en: 'Which of these is a hidden cost that a multi-agent design introduces?',
      fr: 'Lequel de ces éléments est un coût caché introduit par une conception multi-agents ?',
    },
    options: [
      {
        text: {
          en: 'Coordination overhead, cost multiplication, and harder observability.',
          fr: "Surcoût de coordination, multiplication des coûts et observabilité plus difficile.",
        },
      },
      {
        text: {
          en: 'Guaranteed lower latency in every case.',
          fr: 'Une latence garantie plus faible dans tous les cas.',
        },
      },
      {
        text: {
          en: 'Automatic elimination of all error propagation.',
          fr: "L'élimination automatique de toute propagation d'erreurs.",
        },
      },
    ],
    correctIndex: 0,
  },
  {
    id: 'guardrails-five-layers',
    prompt: {
      en: 'Which option lists the five guardrail layers of defense in depth?',
      fr: 'Quelle option énumère les cinq couches de garde-fous en défense en profondeur ?',
    },
    options: [
      {
        text: {
          en: 'Permissions, operational limits, human approval, observability, and kill switch.',
          fr: "Permissions, limites opérationnelles, approbation humaine, observabilité et interrupteur d'arrêt.",
        },
      },
      {
        text: {
          en: 'Firewall, antivirus, VPN, backup, and password.',
          fr: 'Pare-feu, antivirus, VPN, sauvegarde et mot de passe.',
        },
      },
      {
        text: {
          en: 'Encryption, compression, caching, logging, and sharding.',
          fr: 'Chiffrement, compression, mise en cache, journalisation et partitionnement.',
        },
      },
    ],
    correctIndex: 0,
  },
  {
    id: 'guardrails-permissions-question',
    prompt: {
      en: 'The permissions guardrail layer answers which question?',
      fr: 'La couche de garde-fou « permissions » répond à quelle question ?',
    },
    options: [
      {
        text: {
          en: 'How much may the agent do?',
          fr: "Quelle quantité d'actions l'agent peut-il effectuer ?",
        },
      },
      {
        text: {
          en: 'What may the agent touch?',
          fr: "À quoi l'agent peut-il toucher ?",
        },
      },
      {
        text: {
          en: 'Can we stop the agent now?',
          fr: "Peut-on arrêter l'agent maintenant ?",
        },
      },
    ],
    correctIndex: 1,
  },
  {
    id: 'hitl-degrees-oversight',
    prompt: {
      en: 'Which option correctly names the three degrees of human oversight?',
      fr: 'Quelle option nomme correctement les trois degrés de supervision humaine ?',
    },
    options: [
      {
        text: {
          en: 'Human-in-the-loop, human-on-the-loop, and human-out-of-the-loop.',
          fr: "Humain dans la boucle, humain sur la boucle et humain hors de la boucle.",
        },
      },
      {
        text: {
          en: 'Manual, semi-automatic, and turbo.',
          fr: 'Manuel, semi-automatique et turbo.',
        },
      },
      {
        text: {
          en: 'Read, write, and execute.',
          fr: 'Lecture, écriture et exécution.',
        },
      },
    ],
    correctIndex: 0,
  },
  {
    id: 'threat-modeling-agent-specific-threats',
    prompt: {
      en: 'In the threat-modeling workshop, which three agent-specific threats must the model cover?',
      fr: "Dans l'atelier de modélisation des menaces, quelles trois menaces propres aux agents le modèle doit-il couvrir ?",
    },
    options: [
      {
        text: {
          en: 'Tool misuse, prompt injection, and runaway loops.',
          fr: "Mauvais usage des outils, injection de prompt et boucles incontrôlées.",
        },
      },
      {
        text: {
          en: 'Slow typing, low battery, and small screens.',
          fr: 'Frappe lente, batterie faible et petits écrans.',
        },
      },
      {
        text: {
          en: 'Font errors, color contrast, and spelling mistakes.',
          fr: "Erreurs de police, contraste des couleurs et fautes d'orthographe.",
        },
      },
    ],
    correctIndex: 0,
  },
  {
    id: 'shai-mcp-enabled-tools-wildcard',
    prompt: {
      en: 'In the SHAI MCP configuration, what does setting `enabled_tools` to `["*"]` mean from a governance standpoint?',
      fr: "Dans la configuration MCP de SHAI, que signifie, du point de vue de la gouvernance, le fait de régler `enabled_tools` sur `[\"*\"]` ?",
    },
    options: [
      {
        text: {
          en: 'It grants the agent every tool the server exposes, present and future — the opposite of least privilege.',
          fr: "Cela accorde à l'agent chaque outil exposé par le serveur, présent et futur — l'inverse du moindre privilège.",
        },
      },
      {
        text: {
          en: 'It disables all tools so the agent is read-only.',
          fr: "Cela désactive tous les outils pour que l'agent soit en lecture seule.",
        },
      },
      {
        text: {
          en: 'It limits the agent to exactly one tool chosen at random.',
          fr: "Cela limite l'agent à un seul outil choisi au hasard.",
        },
      },
    ],
    correctIndex: 0,
  },
];
