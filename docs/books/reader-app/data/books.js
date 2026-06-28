/**
 * 电子书清单
 *
 * category 分类（自定义字符串，侧边栏会自动按此分组）:
 *   - 'english'  英语学习
 *   - 'database' 数据库
 *   - 'tech'     技术
 *   - 可自由扩展……
 *
 * format 决定渲染方式: 'epub' | 'pdf' | 'mobi' | 'azw3'
 * path 为相对于 reader-app/index.html 的路径
 */
window.EBOOK_CATALOG = [
  // ── 英语 ──
  {
    id: 'nce1',
    title: '新概念英语1课堂笔记',
    author: 'leo',
    category: 'leo_nce_notes',
    format: 'pdf',
    path: 'https://raw.githubusercontent.com/sufangmu/books/refs/heads/main/leo_nce_note/新概念英语1课堂笔记.pdf',
    description: '新概念英语第一册课堂笔记'
  },
  {
    id: 'nce2',
    title: '新概念英语2课堂笔记',
    author: 'leo',
    category: 'leo_nce_notes',
    format: 'pdf',
    path: 'https://raw.githubusercontent.com/sufangmu/books/refs/heads/main/leo_nce_note/新概念英语2课堂笔记.pdf',
    description: '新概念英语第二册课堂笔记'
  },
  {
    id: 'nce3',
    title: '新概念英语3课堂笔记',
    author: 'leo',
    category: 'leo_nce_notes',
    format: 'pdf',
    path: 'https://raw.githubusercontent.com/sufangmu/books/refs/heads/main/leo_nce_note/新概念英语3课堂笔记.pdf',
    description: '新概念英语第三册课堂笔记'
  },
  {
    id: 'moyan_7',
    title: '莫言经典作品(套装7册)',
    author: '莫言',
    category: 'novel',
    format: 'epub',
    path: 'https://raw.githubusercontent.com/sufangmu/books/refs/heads/main/novel/莫言经典作品(套装7册).epub',
    description: '莫言经典作品(套装7册)'
  },
  {
    id: 'CriticalThinking',
    title: 'Critical Thinking',
    author: 'Brooke Moore, Richard Parker',
    category: 'original_english_textbook',
    format: 'epub',
    path: 'https://raw.githubusercontent.com/sufangmu/books/refs/heads/main/original_english_textbook/CriticalThinking.epub',
    description: 'Critical Thinking'
  },
  {
    id: 'TheBestLifeStories',
    title: 'The Best Life Stories',
    author: "Reader's Digest",
    category: 'original_english_textbook',
    format: 'pdf',
    path: 'https://raw.githubusercontent.com/sufangmu/books/refs/heads/main/original_english_textbook/TheBestLifeStories.pdf',
    description: 'he Best Life Stories'
  },
  {
    id: 'THEARTOFPUBLICSPEAKING',
    title: 'THE ART OF PUBLIC SPEAKING',
    author: "Stephen E. Lucas, Paul Stob",
    category: 'original_english_textbook',
    format: 'pdf',
    path: 'https://raw.githubusercontent.com/sufangmu/books/refs/heads/main/original_english_textbook/THEARTOFPUBLICSPEAKING.pdf',
    description: 'THE ART OF PUBLIC SPEAKING'
  },
  {
    id: 'SteveJobs',
    title: 'Steve Jobs',
    author: 'Walter Isaacson',
    category: 'original_english_textbook',
    format: 'pdf',
    path: 'https://raw.githubusercontent.com/sufangmu/books/refs/heads/main/original_english_textbook/SteveJobs.pdf',
    description: 'Steve Jobs'
  }
];
