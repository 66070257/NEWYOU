export const setupFirestoreReferenceMocks = ({ collection, orderBy, query, doc }) => {
    collection.mockImplementation((...args) => ({ type: "collection", args }));
    orderBy.mockImplementation((...args) => ({ type: "orderBy", args }));
    query.mockImplementation((...args) => ({ type: "query", args }));
    doc.mockImplementation((...args) => ({ type: "doc", args }));
};

export const createSnapshotCallbackRegistry = ({ onSnapshot }) => {
    const snapshotCallbacks = [];

    onSnapshot.mockImplementation((ref, callback) => {
        snapshotCallbacks.push({ ref, callback });
        return jest.fn();
    });

    return {
        getAll: () => snapshotCallbacks,
        getDocCallbackByPath: (...expectedPath) => {
            const target = snapshotCallbacks.find(({ ref }) =>
                ref?.type === "doc"
                && Array.isArray(ref.args)
                && ref.args.length >= expectedPath.length + 1
                && ref.args.slice(1, expectedPath.length + 1).every((segment, index) => segment === expectedPath[index])
            );

            return target?.callback;
        },
        getFirstQueryCallback: () => snapshotCallbacks.find(({ ref }) => ref?.type === "query")?.callback
    };
};

export const createAuthStateEmitter = ({ onAuthStateChanged }) => {
    let authStateCallback = null;

    onAuthStateChanged.mockImplementation((_auth, callback) => {
        authStateCallback = callback;
        return jest.fn();
    });

    return {
        emit: (user) => authStateCallback?.(user)
    };
};
