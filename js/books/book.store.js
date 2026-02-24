// /js/books/book.store.js

export function createBookStore() {

    return {
        byId: new Map(),
        all: [],
        loaded: false
    };
}

if (!window.BookStore) {
    window.BookStore = createBookStore();
}
