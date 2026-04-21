import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card } from '../types';
import CardModal from './CardModal';

interface Props {
  card: Card;
  listId: string;
  onUpdate: (card: Card) => void;
  onDelete: () => void;
}

export default function CardItem({ card, listId, onUpdate, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id, data: { type: 'card', listId } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="card-item"
        onClick={() => setModalOpen(true)}
      >
        <span className="card-title">{card.title}</span>
        {card.description && <p className="card-description">{card.description}</p>}
      </div>

      {modalOpen && (
        <CardModal
          card={card}
          onClose={() => setModalOpen(false)}
          onSave={(updated) => { onUpdate(updated); setModalOpen(false); }}
          onDelete={() => { onDelete(); setModalOpen(false); }}
        />
      )}
    </>
  );
}
