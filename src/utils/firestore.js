export const mapSnapshotDocs = (snapshot) => snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...docItem.data()
}));
