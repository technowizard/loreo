export const filterConfig = {
  priority: [
    {
      description: 'High priority articles for today',
      id: 'must-read',
      name: 'Must Read',
      title: 'Must Read Today'
    },
    {
      description: 'Articles to read this week',
      id: 'this-week',
      name: 'Later This Week',
      title: 'Later This Week'
    },
    {
      description: 'Articles with low priority',
      id: 'low-priority',
      name: 'Low Priority',
      title: 'Low Priority'
    }
  ],
  readLength: [
    {
      description: 'Articles that take less than 10 minutes to read',
      id: 'short',
      name: 'Short Reads',
      title: 'Short Reads (<10 min)'
    },
    {
      description: 'Articles that take 10 minutes or more to read',
      id: 'long',
      name: 'Long Reads',
      title: 'Long Reads (10+ min)'
    }
  ],
  sort: [
    {
      description: 'Show newest saved articles first',
      id: 'newest',
      name: 'Newest Saved',
      title: 'Newest Saved'
    },
    {
      description: 'Show oldest saved articles first',
      id: 'oldest',
      name: 'Oldest Saved',
      title: 'Oldest Saved'
    },
    {
      description: 'Sort all articles by reading time, shortest first',
      id: 'shortest',
      name: 'Shortest to Read',
      title: 'Shortest to Read'
    },
    {
      description: 'Sort all articles by reading time, longest first',
      id: 'longest',
      name: 'Longest to Read',
      title: 'Longest to Read'
    }
  ],
  status: [
    {
      description: 'All articles in your library',
      id: 'all',
      name: 'All',
      title: 'All Articles'
    },
    {
      description: "Articles you haven't read yet",
      id: 'unread',
      name: 'Unread',
      title: 'Unread Articles'
    },
    {
      description: "Articles you've marked as favorites",
      id: 'favorites',
      name: 'Favorites',
      title: 'Favorite Articles'
    },
    {
      description: 'Articles with highlights and annotations',
      id: 'highlights',
      name: 'Highlights & Notes',
      title: 'Highlights & Notes'
    },
    {
      description: "Articles you've archived",
      id: 'archived',
      name: 'Archived',
      title: 'Archived Articles'
    }
  ]
};
