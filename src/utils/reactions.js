import { increment, runTransaction, serverTimestamp } from "firebase/firestore";

export const applyReactionTransaction = async ({ db, itemRef, reactionRef, field, uid }) => {
    await runTransaction(db, async (transaction) => {
        const reactionSnap = await transaction.get(reactionRef);

        if (!reactionSnap.exists()) {
            transaction.update(itemRef, {
                [field]: increment(1)
            });

            transaction.set(reactionRef, {
                uid,
                type: field,
                createdAt: serverTimestamp()
            });
            return;
        }

        const previousType = reactionSnap.data()?.type;

        if (previousType === field) {
            transaction.update(itemRef, {
                [field]: increment(-1)
            });
            transaction.delete(reactionRef);
            return;
        }

        transaction.update(itemRef, {
            [previousType]: increment(-1),
            [field]: increment(1)
        });

        transaction.update(reactionRef, {
            type: field,
            updatedAt: serverTimestamp()
        });
    });
};
