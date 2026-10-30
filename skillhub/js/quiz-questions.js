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
          en: 'Both call tools, but an agent uses more of them than an assistant does within a single response.',
          fr: "Les deux appellent des outils, mais un agent en utilise davantage qu'un assistant au sein d'une même réponse.",
        },
      },
      {
        text: {
          en: 'An assistant and an agent are the same thing; the label just depends on which vendor ships the model.',
          fr: "Un assistant et un agent sont la même chose ; l'appellation dépend seulement de l'éditeur qui fournit le modèle.",
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
          en: 'Scale the autonomy to the difficulty of the task, so harder goals get more freedom to act.',
          fr: "Adapter l'autonomie à la difficulté de la tâche, afin que les objectifs plus ardus bénéficient de plus de liberté d'action.",
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
          en: 'Grant broad autonomy up front, then tighten it only after the agent makes a costly mistake.',
          fr: "Accorder une large autonomie dès le départ, puis la restreindre seulement après que l'agent a commis une erreur coûteuse.",
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
          en: 'Brain, memory, tools, and an execution loop — the essentials an agent needs to run.',
          fr: "Cerveau, mémoire, outils et boucle d'exécution — l'essentiel dont un agent a besoin pour fonctionner.",
        },
      },
      {
        text: {
          en: 'Brain, a single memory store, tools, planner, execution loop, guardrails, and a user interface.',
          fr: "Cerveau, une mémoire unique, outils, planificateur, boucle d'exécution, garde-fous et une interface utilisateur.",
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
          en: 'They are the brain that reasons about the goal and chooses which action to take next.',
          fr: "Ils sont le cerveau qui raisonne sur l'objectif et choisit la prochaine action à entreprendre.",
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
          en: 'They are the planner that breaks the goal into an ordered list of steps before execution.',
          fr: "Ils sont le planificateur qui décompose l'objectif en une liste ordonnée d'étapes avant l'exécution.",
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
          en: 'Think → Act, repeated until a stopping condition is met.',
          fr: "Penser → Agir, répété jusqu'à ce qu'une condition d'arrêt soit remplie.",
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
          en: 'Think → Act → Observe, run exactly once per user request.',
          fr: 'Penser → Agir → Observer, exécuté exactement une fois par requête utilisateur.',
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
        text: {
          en: 'ReAct, which interleaves reasoning and acting on each step but keeps no lesson across attempts.',
          fr: "ReAct, qui entrelace raisonnement et action à chaque étape mais ne conserve aucune leçon d'un essai à l'autre.",
        },
      },
      {
        text: {
          en: 'Plan-and-Execute, which drafts the full plan up front but does not critique a failure and retry with the lesson.',
          fr: "Plan-and-Execute, qui rédige le plan complet au départ mais ne critique pas un échec pour réessayer avec la leçon apprise.",
        },
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
          en: 'Define only the goal-achieved condition, since that is the stop you actually want the agent to reach.',
          fr: "Ne définir que la condition d'objectif atteint, puisque c'est l'arrêt que l'on veut réellement voir l'agent atteindre.",
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
          en: 'Set a very high max-iteration cap so the agent almost always reaches the goal before the limit ever triggers.',
          fr: "Fixer un plafond d'itérations très élevé pour que l'agent atteigne presque toujours l'objectif avant que la limite ne se déclenche.",
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
          en: 'Supervisor, pipeline, and parallel — the three ways agents are wired together.',
          fr: "Superviseur, pipeline et parallèle — les trois façons de relier des agents entre eux.",
        },
      },
      {
        text: {
          en: 'Router, planner, worker, and aggregator.',
          fr: 'Routeur, planificateur, exécutant et agrégateur.',
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
          en: 'Prefer multiple agents by default, since splitting the work into specialists almost always improves quality.',
          fr: "Préférer par défaut plusieurs agents, car répartir le travail entre spécialistes améliore presque toujours la qualité.",
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
          en: 'Split into several agents whenever the task has distinct sub-tasks, since separate concerns deserve separate agents.',
          fr: "Se répartir en plusieurs agents dès que la tâche comporte des sous-tâches distinctes, car des préoccupations séparées méritent des agents séparés.",
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
          en: 'Higher coordination overhead, which is the single cost multi-agent designs add.',
          fr: "Un surcoût de coordination accru, qui est le seul coût ajouté par les conceptions multi-agents.",
        },
      },
      {
        text: {
          en: 'A larger combined context window, since each agent must hold the entire shared conversation in memory.',
          fr: "Une fenêtre de contexte combinée plus grande, puisque chaque agent doit conserver en mémoire toute la conversation partagée.",
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
          en: 'Permissions, operational limits, and human approval.',
          fr: 'Permissions, limites opérationnelles et approbation humaine.',
        },
      },
      {
        text: {
          en: 'Permissions, operational limits, human approval, audit logging, and automatic rollback.',
          fr: "Permissions, limites opérationnelles, approbation humaine, journalisation d'audit et restauration automatique.",
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
          en: 'How many actions may the agent run before it must stop?',
          fr: "Combien d'actions l'agent peut-il exécuter avant de devoir s'arrêter ?",
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
          en: 'Which data may the agent read?',
          fr: "Quelles données l'agent peut-il lire ?",
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
          en: 'Human-in-the-loop and human-on-the-loop.',
          fr: 'Humain dans la boucle et humain sur la boucle.',
        },
      },
      {
        text: {
          en: 'Human-in-the-loop, human-on-the-loop, and fully autonomous.',
          fr: 'Humain dans la boucle, humain sur la boucle et entièrement autonome.',
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
          en: 'Tool misuse and prompt injection.',
          fr: 'Mauvais usage des outils et injection de prompt.',
        },
      },
      {
        text: {
          en: 'SQL injection, cross-site scripting, and weak passwords.',
          fr: 'Injection SQL, script intersites et mots de passe faibles.',
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
          en: 'It grants the agent only the tools the server exposes today, so new tools must be added explicitly.',
          fr: "Cela n'accorde à l'agent que les outils exposés aujourd'hui par le serveur, les nouveaux outils devant être ajoutés explicitement.",
        },
      },
      {
        text: {
          en: 'It enables every tool but keeps them read-only until each one is approved individually.',
          fr: "Cela active tous les outils mais les maintient en lecture seule jusqu'à l'approbation individuelle de chacun.",
        },
      },
    ],
    correctIndex: 0,
  },
];
