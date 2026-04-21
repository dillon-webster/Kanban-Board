export interface Card {
  id: string;
  title: string;
  description: string;
}

export interface List {
  id: string;
  title: string;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  color: string;
  lists: List[];
}

export interface BoardSummary {
  id: string;
  title: string;
  color: string;
  cardCount: number;
}
