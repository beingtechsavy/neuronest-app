export interface SeoTaskConfig {
  slug: string;
  title: string;
  metaDescription: string;
  task: string;
  domain: string;
  defaultFriction: 'dont-know-where-to-start' | 'feels-too-big' | 'anxious-about-doing-it-badly' | 'feels-boring' | 'low-energy' | 'too-many-competing-tasks' | 'not-sure';
  problemInsight: string;
  atomicFirstAction: string;
  estimatedMinutes: number;
  whyItWorks: string;
}

export const SEO_TASKS: SeoTaskConfig[] = [
  {
    slug: 'writing-a-difficult-email',
    title: 'How to Start Replying to a Difficult Email When You Feel Paralyzed',
    metaDescription: 'Stuck staring at a draft email you dread sending? Overcome ADHD email paralysis with one atomic, zero-stakes physical step.',
    task: 'Reply to a difficult email',
    domain: 'communication',
    defaultFriction: 'anxious-about-doing-it-badly',
    problemInsight: 'Difficult emails feel high-stakes because your brain treats replying as a public performance. Staring at an empty subject line triggers social threat appraisal, causing freeze mode.',
    atomicFirstAction: 'Open the email draft, and type one deliberately terrible sentence that you promise yourself you will delete later.',
    estimatedMinutes: 2,
    whyItWorks: 'Lowering the quality bar to zero removes the perfectionism barrier. Once physical words exist on screen, editing requires 80% less executive activation energy than drafting from nothing.',
  },
  {
    slug: 'studying-when-overwhelmed',
    title: 'How to Start Studying When Overwhelmed by Huge Material',
    metaDescription: 'Staring at a massive textbook or lecture backlog? Break academic paralysis with one 2-minute physical initiation step.',
    task: 'Study for my upcoming exam',
    domain: 'study',
    defaultFriction: 'feels-too-big',
    problemInsight: '"Studying" is an abstract container with hundreds of hidden micro-decisions: Which topic? What notes? What flashcards? An overwhelmed working memory shuts down under decision fatigue.',
    atomicFirstAction: 'Open the notes to page 1 and read exactly one subheading out loud. Do not take notes yet.',
    estimatedMinutes: 2,
    whyItWorks: 'Reading a single heading requires no synthesis or memorization. It anchors visual attention to the material without demanding working memory load.',
  },
  {
    slug: 'cleaning-messy-room-adhd',
    title: 'How to Clean a Messy Room When ADHD Paralysis Takes Over',
    metaDescription: 'Room completely cluttered and feeling hopeless? Learn how to break room cleaning freeze without organizing everything.',
    task: 'Clean and tidy my room',
    domain: 'cleaning',
    defaultFriction: 'dont-know-where-to-start',
    problemInsight: 'Visual clutter creates sensory overload. Your brain tries to solve the entire room at once, creating a feeling of cognitive drowning.',
    atomicFirstAction: 'Stand in the center of the room, spot one piece of obvious trash, and drop it into the wastebasket.',
    estimatedMinutes: 1,
    whyItWorks: 'Binary classification (trash vs. not trash) bypasses decision fatigue. Once the body moves, dopamine initiates motor momentum.',
  },
  {
    slug: 'filing-taxes-procrastination',
    title: 'How to Start Doing Your Taxes or Boring Paperwork',
    metaDescription: 'Postponing tax forms or financial admin? Break executive dysfunction on administrative paperwork.',
    task: 'Sort tax documents and file paperwork',
    domain: 'admin',
    defaultFriction: 'feels-boring',
    problemInsight: 'Administrative forms combine low dopamine with high administrative punishment risk (fear of errors), making it a neurological deadlock.',
    atomicFirstAction: 'Create one new folder on your desktop named "Taxes 2026" and locate just your primary W2/income statement PDF.',
    estimatedMinutes: 2,
    whyItWorks: 'Creating a container gives physical shape to an ambiguous task without committing to calculation or tax submission.',
  },
  {
    slug: 'starting-a-coding-task',
    title: 'How to Start Coding When Facing a Complex Bug or Feature',
    metaDescription: 'Stuck staring at a blank IDE or intimidating bug? Break developer task paralysis with an atomic next step.',
    task: 'Debug and start coding the feature',
    domain: 'coding',
    defaultFriction: 'feels-too-big',
    problemInsight: 'Coding requires holding an entire mental model of code paths in working memory. When the scope is ambiguous, initiation inertia spikes.',
    atomicFirstAction: 'Open the repository, checkout a new branch, and add a single empty test or a code comment describing the expected return value.',
    estimatedMinutes: 2,
    whyItWorks: 'Writing a comment requires zero algorithmic complexity but grounds you directly inside the target file context.',
  },
  {
    slug: 'calling-to-make-an-appointment',
    title: 'How to Make a Phone Call You Have Been Dreading for Weeks',
    metaDescription: 'Phone anxiety and ADHD delay? Take the first painless step to book that dentist or doctor appointment.',
    task: 'Call to book an appointment',
    domain: 'communication',
    defaultFriction: 'anxious-about-doing-it-badly',
    problemInsight: 'Phone calls create real-time conversational uncertainty and unpredictability, causing acute social anxiety for neurodivergent brains.',
    atomicFirstAction: 'Open the dialer app and enter the phone number, then write on a sticky note: "Hi, I would like to schedule an appointment for [X]."',
    estimatedMinutes: 2,
    whyItWorks: 'Pre-scripting the first sentence offloads cognitive burden so speech synthesis feels automated and low-pressure.',
  },
  {
    slug: 'doing-the-dishes-adhd-paralysis',
    title: 'How to Start Washing the Dishes When the Sink Is Overloaded',
    metaDescription: 'Sink overflowing and dreading touching wet sponges? Simple neurodivergent technique to wash dishes without exhaustion.',
    task: 'Do the dishes in the sink',
    domain: 'cleaning',
    defaultFriction: 'low-energy',
    problemInsight: 'Dishes trigger sensory defensiveness (wet, slimy textures, smell) combined with low dopamine. Staring at a tower feels like punishment.',
    atomicFirstAction: 'Turn on the hot water and wash exactly one single mug or fork. If you want to stop right after, you are 100% allowed to.',
    estimatedMinutes: 1,
    whyItWorks: 'Giving yourself authentic permission to stop after one item removes the perceived prison of a 30-minute chore.',
  },
  {
    slug: 'finishing-an-assignment-last-minute',
    title: 'How to Begin an Assignment When the Deadline Is Imminent',
    metaDescription: 'Panicking over a fast-approaching essay or homework deadline? Stop the panic spiral and get into immediate execution.',
    task: 'Finish my urgent assignment',
    domain: 'study',
    defaultFriction: 'anxious-about-doing-it-badly',
    problemInsight: 'Adrenaline from panic paradoxically impairs prefrontal cortex executive functioning, locking you in paralysis instead of action.',
    atomicFirstAction: 'Create the document file, write your name and today\'s date at the top, and paste the prompt in bold font.',
    estimatedMinutes: 2,
    whyItWorks: 'Formatting the top of the page is guaranteed progress with 0% risk of failure. It converts an abstract panic into concrete workspace presence.',
  },
];

export function getSeoTaskBySlug(slug: string): SeoTaskConfig | undefined {
  return SEO_TASKS.find((item) => item.slug === slug);
}
