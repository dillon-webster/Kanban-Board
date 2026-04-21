import type { Board } from './types';

export const initialBoard: Board = {
  id: 'board-1',
  title: 'My Project',
  lists: [
    {
      id: 'list-1',
      title: 'To Do',
      cards: [
        { id: 'card-1', title: 'Design mockups', description: 'Create wireframes for the new feature' },
        { id: 'card-2', title: 'Set up repo', description: '' },
      ],
    },
    {
      id: 'list-2',
      title: 'In Progress',
      cards: [
        { id: 'card-3', title: 'Build Kanban board', description: 'React + TypeScript + dnd-kit' },
      ],
    },
    {
      id: 'list-3',
      title: 'Done',
      cards: [
        { id: 'card-4', title: 'Project planning', description: 'Defined scope and tech stack' },
      ],
    },
  ],
};
