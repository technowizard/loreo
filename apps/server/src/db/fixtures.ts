import { defaultUserSettings } from './schemas/user-settings.js';

/**
 * Shared demo fixtures used by both the seed script and integration tests.
 * Keeping them in sync means tests always run against data that reflects the demo.
 *
 * Query branch coverage (for home suggestions tests):
 *
 *   continueReading  — isRead=false, processingStatus='completed', readingProgress > 0
 *   shortReads       — isRead=false, isArchived=false, processingStatus='completed', readingTime < 10
 *   longReads        — isRead=false, isArchived=false, processingStatus='completed', readingTime >= 10
 *
 * Expected counts from this fixture set:
 *   continueReading  → "The Future of Web Performance" (readingProgress: 45)
 *   shortReads       → 3 articles (readingTime: 5, 7, 8) — includes the in-progress one
 *   longReads        → 2 articles (readingTime: 15, 22)
 *   recentlySaved    → 3 most recently created (capped by the query)
 */

export type LinkSeed = {
  url: string;
  title: string;
  readingTime: number;
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  isRead?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  readingProgress?: number;
  priority?: 'none' | 'low-priority' | 'this-week' | 'must-read';
  excerpt?: string;
  author?: string;
  coverImage?: string;
  content?: string;
  textContent?: string;
};

export const DEMO_LINKS: LinkSeed[] = [
  // --- shortReads (readingTime < 10, completed, unread, not archived) ---
  {
    url: 'https://web.dev/articles/cls',
    title: 'Cumulative Layout Shift: What It Is and How to Fix It',
    readingTime: 5,
    processingStatus: 'completed',
    author: 'Annie Sullivan',
    excerpt:
      'CLS measures visual stability. Learn how unexpected layout shifts hurt user experience and how to eliminate them.',
    priority: 'this-week'
  },
  {
    url: 'https://2ality.com/2022/10/javascript-decorators.html',
    title: 'JavaScript Decorators: An In-Depth Guide',
    readingTime: 7,
    processingStatus: 'completed',
    author: 'Axel Rauschmayer',
    excerpt:
      'Decorators are a stage 3 TC39 proposal. This post covers the complete API with practical examples.'
  },
  // --- shortReads + continueReading (readingProgress > 0) ---
  {
    url: 'https://web.dev/articles/performance-http2',
    title: 'The Future of Web Performance',
    readingTime: 8,
    processingStatus: 'completed',
    readingProgress: 45,
    author: 'Barry Pollard',
    excerpt: 'HTTP/2 and HTTP/3 change how browsers load resources. Here is what you need to know.',
    priority: 'must-read',
    isFavorite: true
  },
  // --- longReads (readingTime >= 10, completed, unread, not archived) ---
  {
    url: 'https://martinfowler.com/articles/microservices.html',
    title: 'Microservices: A Definition of This New Architectural Term',
    readingTime: 22,
    processingStatus: 'completed',
    author: 'Martin Fowler',
    excerpt:
      'The term microservice architecture has sprung up over the last few years to describe a particular way of designing software applications.',
    priority: 'low-priority'
  },
  {
    url: 'https://v8.dev/blog/turbofan-jit',
    title: 'Digging into the TurboFan JIT',
    readingTime: 15,
    processingStatus: 'completed',
    author: 'Ben L. Titzer',
    excerpt:
      "A deep dive into the internals of V8's optimizing compiler and how it achieves near-native performance.",
    content:
      "Published 13 July 2015 · Tagged with internals\n\nLast week we announced that we've turned on TurboFan for certain types of JavaScript. In this post we wanted to dig deeper into the design of TurboFan.\n\nPerformance has always been at the core of V8's strategy. TurboFan combines a cutting-edge intermediate representation with a multi-layered translation and optimization pipeline to generate better quality machine code than what was previously possible with the CrankShaft JIT. Optimizations in TurboFan are more numerous, more sophisticated, and more thoroughly applied than in CrankShaft, enabling fluid code motion, control flow optimizations, and precise numerical range analysis, all of which were more previously unattainable.\n\nA layered architecture #\n\nCompilers tend to become complex over time as new language features are supported, new optimizations are added, and new computer architectures are targeted. With TurboFan, we've taken lessons from many compilers and developed a layered architecture to allow the compiler to cope with these demands over time. A clearer separation between the source-level language (JavaScript), the VM's capabilities (V8), and the architecture's intricacies (from x86 to ARM to MIPS) allows for cleaner and more robust code. Layering allows those working on the compiler to reason locally when implementing optimizations and features, as well as write more effective unit tests. It also saves code. Each of the 7 target architectures supported by TurboFan requires fewer than 3,000 lines of platform-specific code, versus 13,000-16,000 in CrankShaft. This enabled engineers at ARM, Intel, MIPS, and IBM to contribute to TurboFan in a much more effective way. TurboFan is able to more easily support all of the coming features of ES6 because its flexible design separates the JavaScript frontend from the architecture-dependent backends.\n\nMore sophisticated optimizations #\n\nThe TurboFan JIT implements more aggressive optimizations than CrankShaft through a number of advanced techniques. JavaScript enters the compiler pipeline in a mostly unoptimized form and is translated and optimized to progressively lower forms until machine code is generated. The centerpiece of the design is a more relaxed sea-of-nodes internal representation (IR) of the code which allows more effective reordering and optimization.\n\nExample TurboFan graph\n\nNumerical range analysis helps TurboFan understand number-crunching code much better. The graph-based IR allows most optimizations to be expressed as simple local reductions which are easier to write and test independently. An optimization engine applies these local rules in a systematic and thorough way. Transitioning out of the graphical representation involves an innovative scheduling algorithm that makes use of the reordering freedom to move code out of loops and into less frequently executed paths. Finally, architecture-specific optimizations like complex instruction selection exploit features of each target platform for the best quality code.\n\nDelivering a new level of performance #\n\nWe're already seeing some great speedups with TurboFan, but there's still a ton of work to do. Stay tuned as we enable more optimizations and turn TurboFan on for more types of code!",
    textContent:
      "Published 13 July 2015 · Tagged with internals\n\nLast week we announced that we’ve turned on TurboFan for certain types of JavaScript. In this post we wanted to dig deeper into the design of TurboFan.\n\nPerformance has always been at the core of V8’s strategy. TurboFan combines a cutting-edge intermediate representation with a multi-layered translation and optimization pipeline to generate better quality machine code than what was previously possible with the CrankShaft JIT. Optimizations in TurboFan are more numerous, more sophisticated, and more thoroughly applied than in CrankShaft, enabling fluid code motion, control flow optimizations, and precise numerical range analysis, all of which were more previously unattainable.\n\nA layered architecture #\n\nCompilers tend to become complex over time as new language features are supported, new optimizations are added, and new computer architectures are targeted. With TurboFan, we've taken lessons from many compilers and developed a layered architecture to allow the compiler to cope with these demands over time. A clearer separation between the source-level language (JavaScript), the VM's capabilities (V8), and the architecture's intricacies (from x86 to ARM to MIPS) allows for cleaner and more robust code. Layering allows those working on the compiler to reason locally when implementing optimizations and features, as well as write more effective unit tests. It also saves code. Each of the 7 target architectures supported by TurboFan requires fewer than 3,000 lines of platform-specific code, versus 13,000-16,000 in CrankShaft. This enabled engineers at ARM, Intel, MIPS, and IBM to contribute to TurboFan in a much more effective way. TurboFan is able to more easily support all of the coming features of ES6 because its flexible design separates the JavaScript frontend from the architecture-dependent backends.\n\nMore sophisticated optimizations #\n\nThe TurboFan JIT implements more aggressive optimizations than CrankShaft through a number of advanced techniques. JavaScript enters the compiler pipeline in a mostly unoptimized form and is translated and optimized to progressively lower forms until machine code is generated. The centerpiece of the design is a more relaxed sea-of-nodes internal representation (IR) of the code which allows more effective reordering and optimization.\n\nExample TurboFan graph\n\nNumerical range analysis helps TurboFan understand number-crunching code much better. The graph-based IR allows most optimizations to be expressed as simple local reductions which are easier to write and test independently. An optimization engine applies these local rules in a systematic and thorough way. Transitioning out of the graphical representation involves an innovative scheduling algorithm that makes use of the reordering freedom to move code out of loops and into less frequently executed paths. Finally, architecture-specific optimizations like complex instruction selection exploit features of each target platform for the best quality code.\n\nDelivering a new level of performance #\n\nWe're already seeing some great speedups with TurboFan, but there's still a ton of work to do. Stay tuned as we enable more optimizations and turn TurboFan on for more types of code!",
    isFavorite: true
  },
  // --- excluded: isRead=true → not counted in shortReads/longReads ---
  {
    url: 'https://exploringjs.com/impatient-js/',
    title: 'JavaScript for Impatient Programmers',
    readingTime: 6,
    processingStatus: 'completed',
    isRead: true
  },
  // --- excluded: isArchived=true → not counted in shortReads/longReads ---
  {
    url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',
    title: 'A Complete Guide to Flexbox',
    readingTime: 9,
    processingStatus: 'completed',
    isArchived: true
  },
  // --- excluded: processingStatus='pending' → not counted anywhere ---
  {
    url: 'https://example.com/pending-article',
    title: 'Pending Article (not yet processed)',
    readingTime: 5,
    processingStatus: 'pending'
  }
];

export const DEMO_RESET_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo@loreo.app',
  name: 'Demo Reader',
  settings: defaultUserSettings
};

export const DEMO_RESET_TAG_GROUPS = [
  {
    id: '00000000-0000-0000-0000-000000000020',
    name: 'Highlights',
    color: '#0ea5e9',
    description: 'Curated demo highlights'
  },
  {
    id: '00000000-0000-0000-0000-000000000021',
    name: 'Compiler Notes',
    color: '#8b5cf6',
    description: 'TurboFan and V8 discussion'
  }
] as const;

export const DEMO_RESET_TAGS = [
  {
    id: '00000000-0000-0000-0000-000000000022',
    groupId: '00000000-0000-0000-0000-000000000020',
    name: 'Intro'
  },
  {
    id: '00000000-0000-0000-0000-000000000023',
    groupId: '00000000-0000-0000-0000-000000000020',
    name: 'Highlight'
  },
  {
    id: '00000000-0000-0000-0000-000000000024',
    groupId: '00000000-0000-0000-0000-000000000021',
    name: 'TurboFan'
  },
  {
    id: '00000000-0000-0000-0000-000000000025',
    groupId: '00000000-0000-0000-0000-000000000021',
    name: 'Notes'
  }
] as const;

export const DEMO_RESET_LINK = {
  id: '00000000-0000-0000-0000-000000000010',
  url: 'https://v8.dev/blog/turbofan-jit',
  title: 'Digging into the TurboFan JIT',
  author: 'Ben L. Titzer',
  excerpt:
    "A deep dive into the internals of V8's optimizing compiler and how it achieves near-native performance.",
  readingTime: 15,
  processingStatus: 'completed' as const,
  isRead: false,
  isFavorite: true,
  isArchived: false,
  readingProgress: 0,
  priority: 'must-read' as const,
  content:
    "Published 13 July 2015 · Tagged with internals\n\nLast week we announced that we've turned on TurboFan for certain types of JavaScript. In this post we wanted to dig deeper into the design of TurboFan.\n\nPerformance has always been at the core of V8's strategy. TurboFan combines a cutting-edge intermediate representation with a multi-layered translation and optimization pipeline to generate better quality machine code than what was previously possible with the CrankShaft JIT. Optimizations in TurboFan are more numerous, more sophisticated, and more thoroughly applied than in CrankShaft, enabling fluid code motion, control flow optimizations, and precise numerical range analysis, all of which were more previously unattainable.\n\nA layered architecture #\n\nCompilers tend to become complex over time as new language features are supported, new optimizations are added, and new computer architectures are targeted. With TurboFan, we've taken lessons from many compilers and developed a layered architecture to allow the compiler to cope with these demands over time. A clearer separation between the source-level language (JavaScript), the VM's capabilities (V8), and the architecture's intricacies (from x86 to ARM to MIPS) allows for cleaner and more robust code. Layering allows those working on the compiler to reason locally when implementing optimizations and features, as well as write more effective unit tests. It also saves code. Each of the 7 target architectures supported by TurboFan requires fewer than 3,000 lines of platform-specific code, versus 13,000-16,000 in CrankShaft. This enabled engineers at ARM, Intel, MIPS, and IBM to contribute to TurboFan in a much more effective way. TurboFan is able to more easily support all of the coming features of ES6 because its flexible design separates the JavaScript frontend from the architecture-dependent backends.\n\nMore sophisticated optimizations #\n\nThe TurboFan JIT implements more aggressive optimizations than CrankShaft through a number of advanced techniques. JavaScript enters the compiler pipeline in a mostly unoptimized form and is translated and optimized to progressively lower forms until machine code is generated. The centerpiece of the design is a more relaxed sea-of-nodes internal representation (IR) of the code which allows more effective reordering and optimization.\n\nExample TurboFan graph\n\nNumerical range analysis helps TurboFan understand number-crunching code much better. The graph-based IR allows most optimizations to be expressed as simple local reductions which are easier to write and test independently. An optimization engine applies these local rules in a systematic and thorough way. Transitioning out of the graphical representation involves an innovative scheduling algorithm that makes use of the reordering freedom to move code out of loops and into less frequently executed paths. Finally, architecture-specific optimizations like complex instruction selection exploit features of each target platform for the best quality code.\n\nDelivering a new level of performance #\n\nWe're already seeing some great speedups with TurboFan, but there's still a ton of work to do. Stay tuned as we enable more optimizations and turn TurboFan on for more types of code!",
  textContent:
    "Published 13 July 2015 · Tagged with internals\n\nLast week we announced that we’ve turned on TurboFan for certain types of JavaScript. In this post we wanted to dig deeper into the design of TurboFan.\n\nPerformance has always been at the core of V8’s strategy. TurboFan combines a cutting-edge intermediate representation with a multi-layered translation and optimization pipeline to generate better quality machine code than what was previously possible with the CrankShaft JIT. Optimizations in TurboFan are more numerous, more sophisticated, and more thoroughly applied than in CrankShaft, enabling fluid code motion, control flow optimizations, and precise numerical range analysis, all of which were more previously unattainable.\n\nA layered architecture #\n\nCompilers tend to become complex over time as new language features are supported, new optimizations are added, and new computer architectures are targeted. With TurboFan, we've taken lessons from many compilers and developed a layered architecture to allow the compiler to cope with these demands over time. A clearer separation between the source-level language (JavaScript), the VM's capabilities (V8), and the architecture's intricacies (from x86 to ARM to MIPS) allows for cleaner and more robust code. Layering allows those working on the compiler to reason locally when implementing optimizations and features, as well as write more effective unit tests. It also saves code. Each of the 7 target architectures supported by TurboFan requires fewer than 3,000 lines of platform-specific code, versus 13,000-16,000 in CrankShaft. This enabled engineers at ARM, Intel, MIPS, and IBM to contribute to TurboFan in a much more effective way. TurboFan is able to more easily support all of the coming features of ES6 because its flexible design separates the JavaScript frontend from the architecture-dependent backends.\n\nMore sophisticated optimizations #\n\nThe TurboFan JIT implements more aggressive optimizations than CrankShaft through a number of advanced techniques. JavaScript enters the compiler pipeline in a mostly unoptimized form and is translated and optimized to progressively lower forms until machine code is generated. The centerpiece of the design is a more relaxed sea-of-nodes internal representation (IR) of the code which allows more effective reordering and optimization.\n\nExample TurboFan graph\n\nNumerical range analysis helps TurboFan understand number-crunching code much better. The graph-based IR allows most optimizations to be expressed as simple local reductions which are easier to write and test independently. An optimization engine applies these local rules in a systematic and thorough way. Transitioning out of the graphical representation involves an innovative scheduling algorithm that makes use of the reordering freedom to move code out of loops and into less frequently executed paths. Finally, architecture-specific optimizations like complex instruction selection exploit features of each target platform for the best quality code.\n\nDelivering a new level of performance #\n\nWe're already seeing some great speedups with TurboFan, but there's still a ton of work to do. Stay tuned as we enable more optimizations and turn TurboFan on for more types of code!"
};

export const DEMO_RESET_HIGHLIGHTS = [
  {
    id: '00000000-0000-0000-0000-000000000030',
    linkId: DEMO_RESET_LINK.id,
    text: 'TurboFan combines a cutting-edge intermediate representation with a multi-layered translation and optimization pipeline',
    note: null,
    startOffset: 259,
    endOffset: 378,
    color: 'yellow'
  },
  {
    id: '00000000-0000-0000-0000-000000000031',
    linkId: DEMO_RESET_LINK.id,
    text: "A clearer separation between the source-level language (JavaScript), the VM's capabilities (V8), and the architecture's intricacies",
    note: "separation of source level language and VM's capabilities",
    startOffset: 1069,
    endOffset: 1200,
    color: 'blue'
  },
  {
    id: '00000000-0000-0000-0000-000000000032',
    linkId: DEMO_RESET_LINK.id,
    text: 'Each of the 7 target architectures supported by TurboFan requires fewer than 3,000 lines of platform-specific code',
    note: null,
    startOffset: 1442,
    endOffset: 1556,
    color: 'green'
  },
  {
    id: '00000000-0000-0000-0000-000000000033',
    linkId: DEMO_RESET_LINK.id,
    text: 'The centerpiece of the design is a more relaxed sea-of-nodes internal representation (IR) of the code',
    note: null,
    startOffset: 2195,
    endOffset: 2296,
    color: 'pink'
  },
  {
    id: '00000000-0000-0000-0000-000000000034',
    linkId: DEMO_RESET_LINK.id,
    text: 'Transitioning out of the graphical representation involves an innovative scheduling algorithm',
    note: null,
    startOffset: 2686,
    endOffset: 2779,
    color: 'orange'
  }
] as const;
