// undo.manager.js

class UndoManager {
    constructor(limit = 100) {
        this.limit = limit;
        this.undoStack = [];
        this.redoStack = [];
    }

    push(entry) {
        this.undoStack.push(entry);

        if (this.undoStack.length > this.limit) {
            this.undoStack.shift();
        }

        this.redoStack.length = 0;
        window.updateUndoRedoUI?.();
    }

    undo() {
        const entry = this.undoStack.pop();
        if (!entry) return;

        entry.target.setState(entry.before);
        this.redoStack.push(entry);
        window.updateUndoRedoUI?.();
    }

    redo() {
        const entry = this.redoStack.pop();
        if (!entry) return;

        entry.target.setState(entry.after);
        this.undoStack.push(entry);
        window.updateUndoRedoUI?.();
    }

    canUndo() {
        return this.undoStack.length > 0;
    }

    canRedo() {
        return this.redoStack.length > 0;
    }
}

export const undoManager = new UndoManager(100);
