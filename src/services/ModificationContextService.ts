import { create } from 'zustand';

interface ModificationContextState {
  // Контекст текущей модификации
  currentModificationId: number | null;
  currentNominalId: number | null;
  currentSide: 'obverse' | 'reverse';
  currentNominalValue: string;

  // Действия
  setModificationContext: (
    modificationId: number,
    nominalId: number,
    side: 'obverse' | 'reverse',
    nominalValue: string
  ) => void;

  clearContext: () => void;
  setCurrentSide: (side: 'obverse' | 'reverse') => void;
}

export const useModificationContextStore = create<ModificationContextState>((set) => ({
  currentModificationId: null,
  currentNominalId: null,
  currentSide: 'obverse',
  currentNominalValue: '',

  setModificationContext: (modificationId, nominalId, side, nominalValue) => {
    set({
      currentModificationId: modificationId,
      currentNominalId: nominalId,
      currentSide: side,
      currentNominalValue: nominalValue,
    });
  },

  clearContext: () => {
    set({
      currentModificationId: null,
      currentNominalId: null,
      currentSide: 'obverse',
      currentNominalValue: '',
    });
  },

  setCurrentSide: (side) => {
    set({ currentSide: side });
  },
}));
