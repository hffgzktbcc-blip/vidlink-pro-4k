import type { MediaItem } from '../types';

export const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' },
];

export const MOCK_HERO_ITEMS: MediaItem[] = [
  {
    id: 693134,
    title: 'Dune: Part Two',
    media_type: 'movie',
    overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
    poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop_path: '/xOMo8BRK7PfcJv9JCnx7s5200fr.jpg',
    release_date: '2024-03-01',
    vote_average: 8.3,
    vote_count: 5400,
    genre_ids: [878, 12, 18],
    runtime: 166,
    tagline: 'Long live the fighters.',
    is4K: true,
    videos: {
      results: [
        { id: '1', key: 'Way9Dexny3w', name: 'Official Trailer 3', site: 'YouTube', type: 'Trailer', official: true }
      ]
    },
    credits: {
      cast: [
        { id: 1, name: 'Timothée Chalamet', character: 'Paul Atreides', profile_path: '/8j58iCqD9i6yDqJk7zZc8u0pC0a.jpg' },
        { id: 2, name: 'Zendaya', character: 'Chani', profile_path: '/r3A7ev7Qkjv928929.jpg' },
        { id: 3, name: 'Rebecca Ferguson', character: 'Lady Jessica', profile_path: '/6NRi4W69399.jpg' },
        { id: 4, name: 'Austin Butler', character: 'Feyd-Rautha', profile_path: '/a9842839482.jpg' }
      ]
    }
  },
  {
    id: 533535,
    title: 'Deadpool & Wolverine',
    media_type: 'movie',
    overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary Deadpool behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.',
    poster_path: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop_path: '/yDHYTfa2wfbyJ1PZnOU98b4Y1Jq.jpg',
    release_date: '2024-07-26',
    vote_average: 7.7,
    vote_count: 6100,
    genre_ids: [28, 35, 878],
    runtime: 128,
    tagline: 'Come together.',
    is4K: true,
    videos: {
      results: [
        { id: '2', key: '73_1biulkYk', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true }
      ]
    }
  },
  {
    id: 94605,
    name: 'Arcane: League of Legends',
    media_type: 'tv',
    overview: 'Set in the utopian region of Piltover and the underground of Zaun, the story follows the origins of two iconic League champions-and the power that will tear them apart.',
    poster_path: '/fqldfq2nqXY0m7Xy7OdTVq12TN6.jpg',
    backdrop_path: '/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
    first_air_date: '2021-11-06',
    vote_average: 8.8,
    vote_count: 4200,
    genre_ids: [16, 878, 14, 28],
    number_of_seasons: 2,
    number_of_episodes: 18,
    tagline: 'Every legend has a beginning.',
    is4K: true,
    videos: {
      results: [
        { id: '3', key: 'fXmAurh012s', name: 'Final Season Official Trailer', site: 'YouTube', type: 'Trailer', official: true }
      ]
    }
  },
  {
    id: 872585,
    title: 'Oppenheimer',
    media_type: 'movie',
    overview: 'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II.',
    poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop_path: '/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    release_date: '2023-07-21',
    vote_average: 8.1,
    vote_count: 9200,
    genre_ids: [18, 36],
    runtime: 181,
    tagline: 'The world forever changes.',
    is4K: true,
    videos: {
      results: [
        { id: '4', key: 'uYPbbksJxIg', name: 'Official Trailer', site: 'YouTube', type: 'Trailer', official: true }
      ]
    }
  },
  {
    id: 94997,
    name: 'House of the Dragon',
    media_type: 'tv',
    overview: 'The Targaryen dynasty is at the absolute apex of its power, with more than 15 dragons under their yoke. Most empires crumble from such heights. In the case of the Targaryens, their slow fall begins when King Viserys breaks with a century of tradition by naming his daughter Rhaenyra heir to the Iron Throne.',
    poster_path: '/1X4h40fcB4WWUmIBK0auT4zRBAV.jpg',
    backdrop_path: '/etj5je2o602jvhk93m32sg4b.jpg',
    first_air_date: '2022-08-21',
    vote_average: 8.4,
    vote_count: 4500,
    genre_ids: [10765, 18, 10759],
    number_of_seasons: 2,
    number_of_episodes: 18,
    tagline: 'Fire will reign.',
    is4K: true
  }
];

export const MOCK_TRENDING_MOVIES: MediaItem[] = [
  {
    id: 693134,
    title: 'Dune: Part Two',
    media_type: 'movie',
    overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
    poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop_path: '/xOMo8BRK7PfcJv9JCnx7s5200fr.jpg',
    release_date: '2024-03-01',
    vote_average: 8.3,
    vote_count: 5400,
    genre_ids: [878, 12, 18],
    is4K: true
  },
  {
    id: 533535,
    title: 'Deadpool & Wolverine',
    media_type: 'movie',
    overview: 'Deadpool joins forces with Wolverine in a multiverse adventure.',
    poster_path: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop_path: '/yDHYTfa2wfbyJ1PZnOU98b4Y1Jq.jpg',
    release_date: '2024-07-26',
    vote_average: 7.7,
    vote_count: 6100,
    genre_ids: [28, 35, 878],
    is4K: true
  },
  {
    id: 1022789,
    title: 'Inside Out 2',
    media_type: 'movie',
    overview: 'Teenager Riley navigates new emotions including Anxiety, Envy, Ennui, and Embarrassment.',
    poster_path: '/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
    backdrop_path: '/p5ozvmdgsmbWe0H8wfACSSIIFdQ.jpg',
    release_date: '2024-06-14',
    vote_average: 7.6,
    vote_count: 5200,
    genre_ids: [16, 10751, 12, 35],
    is4K: true
  },
  {
    id: 573435,
    title: 'Bad Boys: Ride or Die',
    media_type: 'movie',
    overview: 'Miami detectives Mike Lowrey and Marcus Burnett are on the run after their late captain is linked to a cartel conspiracy.',
    poster_path: '/nP6RliHjxsz4irTKsxe8FRhKZYl.jpg',
    backdrop_path: '/ga4OLm4qLxOqT3b2W3C6c3L2u.jpg',
    release_date: '2024-06-07',
    vote_average: 7.5,
    vote_count: 2400,
    genre_ids: [28, 80, 35],
    is4K: true
  },
  {
    id: 872585,
    title: 'Oppenheimer',
    media_type: 'movie',
    overview: 'The story of J. Robert Oppenheimer and the Manhattan Project.',
    poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop_path: '/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    release_date: '2023-07-21',
    vote_average: 8.1,
    vote_count: 9200,
    genre_ids: [18, 36],
    is4K: true
  },
  {
    id: 157336,
    title: 'Interstellar',
    media_type: 'movie',
    overview: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity’s survival.',
    poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop_path: '/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    release_date: '2014-11-07',
    vote_average: 8.4,
    vote_count: 36000,
    genre_ids: [12, 18, 878],
    is4K: true
  },
  {
    id: 414906,
    title: 'The Batman',
    media_type: 'movie',
    overview: 'Batman ventures into Gotham City’s underworld when a sadistic killer leaves behind a trail of cryptic clues.',
    poster_path: '/74xTEgt7R36Fpooo50r9T25onhq.jpg',
    backdrop_path: '/t7I942V56Z37fJ34Q7zM3q5g92.jpg',
    release_date: '2022-03-04',
    vote_average: 7.7,
    vote_count: 10000,
    genre_ids: [80, 9648, 53],
    is4K: true
  },
  {
    id: 569094,
    title: 'Spider-Man: Across the Spider-Verse',
    media_type: 'movie',
    overview: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its existence.',
    poster_path: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    backdrop_path: '/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    release_date: '2023-06-02',
    vote_average: 8.4,
    vote_count: 7000,
    genre_ids: [16, 28, 12, 878],
    is4K: true
  }
];

export const MOCK_TRENDING_TV: MediaItem[] = [
  {
    id: 94605,
    name: 'Arcane: League of Legends',
    media_type: 'tv',
    overview: 'Origins of two iconic League champions in Piltover and Zaun.',
    poster_path: '/fqldfq2nqXY0m7Xy7OdTVq12TN6.jpg',
    backdrop_path: '/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
    first_air_date: '2021-11-06',
    vote_average: 8.8,
    vote_count: 4200,
    genre_ids: [16, 878, 14, 28],
    number_of_seasons: 2,
    number_of_episodes: 18,
    is4K: true
  },
  {
    id: 94997,
    name: 'House of the Dragon',
    media_type: 'tv',
    overview: 'The Targaryen civil war known as the Dance of the Dragons.',
    poster_path: '/1X4h40fcB4WWUmIBK0auT4zRBAV.jpg',
    backdrop_path: '/etj5je2o602jvhk93m32sg4b.jpg',
    first_air_date: '2022-08-21',
    vote_average: 8.4,
    vote_count: 4500,
    genre_ids: [10765, 18, 10759],
    number_of_seasons: 2,
    number_of_episodes: 18,
    is4K: true
  },
  {
    id: 100088,
    name: 'The Last of Us',
    media_type: 'tv',
    overview: 'Joel, a hardened survivor, is hired to smuggle 14-year-old Ellie out of an oppressive quarantine zone across a post-apocalyptic America.',
    poster_path: '/uKvVjHNqB5VmOrdxqAt2V7JMrne.jpg',
    backdrop_path: '/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
    first_air_date: '2023-01-15',
    vote_average: 8.6,
    vote_count: 5300,
    genre_ids: [18, 10759, 10765],
    number_of_seasons: 2,
    number_of_episodes: 16,
    is4K: true
  },
  {
    id: 66732,
    name: 'Stranger Things',
    media_type: 'tv',
    overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
    poster_path: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    backdrop_path: '/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
    first_air_date: '2016-07-15',
    vote_average: 8.6,
    vote_count: 17000,
    genre_ids: [18, 10765, 9648],
    number_of_seasons: 5,
    number_of_episodes: 42,
    is4K: true
  },
  {
    id: 1399,
    name: 'Game of Thrones',
    media_type: 'tv',
    overview: 'Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia.',
    poster_path: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    backdrop_path: '/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg',
    first_air_date: '2011-04-17',
    vote_average: 8.4,
    vote_count: 24000,
    genre_ids: [10765, 18, 10759],
    number_of_seasons: 8,
    number_of_episodes: 73,
    is4K: true
  },
  {
    id: 1396,
    name: 'Breaking Bad',
    media_type: 'tv',
    overview: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family’s financial future.',
    poster_path: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
    backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
    first_air_date: '2008-01-20',
    vote_average: 8.9,
    vote_count: 14000,
    genre_ids: [18, 80],
    number_of_seasons: 5,
    number_of_episodes: 62,
    is4K: true
  },
  {
    id: 84958,
    name: 'Loki',
    media_type: 'tv',
    overview: 'The mercurial villain Loki resumes his role as the God of Mischief following the events of "Avengers: Endgame".',
    poster_path: '/voHUmluYmKyleFk9a3xgHyKvKT5.jpg',
    backdrop_path: '/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg',
    first_air_date: '2021-06-09',
    vote_average: 8.2,
    vote_count: 12000,
    genre_ids: [18, 10765, 10759],
    number_of_seasons: 2,
    number_of_episodes: 12,
    is4K: true
  },
  {
    id: 93405,
    name: 'Squid Game',
    media_type: 'tv',
    overview: 'Hundreds of cash-strapped players accept a strange invitation to compete in children’s games. Inside, a tempting prize awaits with deadly high stakes.',
    poster_path: '/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg',
    backdrop_path: '/qw3J9crL1gXv79oWpG7e366b96.jpg',
    first_air_date: '2021-09-17',
    vote_average: 7.8,
    vote_count: 14000,
    genre_ids: [18, 9648, 10759],
    number_of_seasons: 2,
    number_of_episodes: 15,
    is4K: true
  }
];

export const MOCK_4K_COLLECTION: MediaItem[] = [
  ...MOCK_TRENDING_MOVIES.map(item => ({ ...item, is4K: true })),
  ...MOCK_TRENDING_TV.map(item => ({ ...item, is4K: true }))
];
