import { Node, Edge } from 'reactflow';

export interface BoardState {
  nodes: Node[];
  edges: Edge[];
}

export class StorageService {
  private static readonly BOARD_KEY = 'board';

  public static handleNew(): BoardState {
    try {
      this.clearBoard();
      return { nodes: [], edges: [] };
    } catch (error) {
      console.error('Failed to create new board:', error);
      throw new Error('Failed to create new board');
    }
  }

  public static handleSave(nodes: Node[], edges: Edge[]): void {
    try {
      this.saveBoard(nodes, edges);
    } catch (error) {
      console.error('Failed to save:', error);
      throw new Error('Failed to save board state');
    }
  }

  public static saveBoard(nodes: Node[], edges: Edge[]): void {
    try {
      const storage: BoardState = { nodes, edges };
      window.localStorage.setItem(this.BOARD_KEY, JSON.stringify(storage));
    } catch (error) {
      console.error('Failed to save board:', error);
      throw new Error('Failed to save board state');
    }
  }

  public static loadBoard(): BoardState | null {
    try {
      const savedData = window.localStorage.getItem(this.BOARD_KEY);
      if (!savedData) return null;
      
      const parsedData = JSON.parse(savedData) as BoardState;
      return parsedData;
    } catch (error) {
      console.error('Failed to load board:', error);
      return null;
    }
  }

  public static clearBoard(): void {
    try {
      window.localStorage.removeItem(this.BOARD_KEY);
    } catch (error) {
      console.error('Failed to clear board:', error);
      throw new Error('Failed to clear board state');
    }
  }
} 