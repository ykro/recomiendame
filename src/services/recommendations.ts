import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  runTransaction,
  orderBy,
  arrayUnion,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type {
  Recommendation,
  Review,
  SavedPlace,
  GroupList,
  ListOption,
  ListVote,
  CategoryType,
  PriceLevel,
  RatingLevel,
} from '../types';

export const EXAMPLE_RECOMMENDATION_NAMES = [
  'Café Las Acacias',
  'Trattoria La Pergola',
  'Mirador del Parque',
  'Bar Cantina Central',
  'Bistró del Río',
  'Tostaduría San Telmo',
  'Jardín Botánico Municipal',
  'Club de Jazz 440',
];

// Subscribe to public/reported recommendations
export function subscribeToFeed(
  onSuccess: (recommendations: Recommendation[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, 'recommendations');
  const q = query(colRef, where('status', 'in', ['publicada', 'reportada']));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Recommendation[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || '',
          category: data.category || 'comer',
          zone: data.zone || '',
          price: data.price || 1,
          rating: data.rating || 5,
          whatToOrder: data.whatToOrder || '',
          comment: data.comment || '',
          authorId: data.authorId || '',
          authorName: data.authorName || '',
          status: data.status || 'publicada',
          reviewCount: data.reviewCount ?? 0,
          ratingSum: data.ratingSum ?? 0,
          createdAt: data.createdAt,
        });
      });
      onSuccess(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'recommendations');
    }
  );
}

// Subscribe to user's recommendations (Mis recomendaciones, filtering by authorId and status)
export function subscribeToUserRecommendations(
  authorId: string,
  onSuccess: (recommendations: Recommendation[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, 'recommendations');
  const q = query(
    colRef,
    where('authorId', '==', authorId),
    where('status', 'in', ['publicada', 'reportada'])
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Recommendation[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || '',
          category: data.category || 'comer',
          zone: data.zone || '',
          price: data.price || 1,
          rating: data.rating || 5,
          whatToOrder: data.whatToOrder || '',
          comment: data.comment || '',
          authorId: data.authorId || '',
          authorName: data.authorName || '',
          status: data.status || 'publicada',
          reviewCount: data.reviewCount ?? 0,
          ratingSum: data.ratingSum ?? 0,
          createdAt: data.createdAt,
        });
      });
      items.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      onSuccess(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'recommendations');
    }
  );
}

// Subscribe to a single recommendation for live changes in detail view
export function subscribeToRecommendation(
  id: string,
  onSuccess: (item: Recommendation | null) => void,
  onError?: (error: Error) => void
) {
  const docRef = doc(db, 'recommendations', id);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        onSuccess(null);
        return;
      }
      const data = docSnap.data();
      onSuccess({
        id: docSnap.id,
        name: data.name || '',
        category: data.category || 'comer',
        zone: data.zone || '',
        price: data.price || 1,
        rating: data.rating || 5,
        whatToOrder: data.whatToOrder || '',
        comment: data.comment || '',
        authorId: data.authorId || '',
        authorName: data.authorName || '',
        status: data.status || 'publicada',
        reviewCount: data.reviewCount ?? 0,
        ratingSum: data.ratingSum ?? 0,
        createdAt: data.createdAt,
      });
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, `recommendations/${id}`);
    }
  );
}

// Subscribe to reviews of a place
export function subscribeToReviews(
  recommendationId: string,
  onSuccess: (reviews: Review[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, 'recommendations', recommendationId, 'reviews');
  // Order by createdAt descending
  const q = query(colRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Review[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          recommendationId,
          authorId: data.authorId || docSnap.id,
          authorName: data.authorName || '',
          rating: data.rating || 5,
          comment: data.comment || '',
          createdAt: data.createdAt,
        });
      });
      onSuccess(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(
        error,
        OperationType.LIST,
        `recommendations/${recommendationId}/reviews`
      );
    }
  );
}

// Create or update review in a single transaction with recommendation counters
export async function saveReviewTransaction(params: {
  recommendationId: string;
  authorId: string;
  authorName: string;
  rating: RatingLevel;
  comment: string;
}): Promise<void> {
  const { recommendationId, authorId, authorName, rating, comment } = params;
  const recRef = doc(db, 'recommendations', recommendationId);
  const reviewRef = doc(db, 'recommendations', recommendationId, 'reviews', authorId);

  try {
    await runTransaction(db, async (transaction) => {
      const recDoc = await transaction.get(recRef);
      if (!recDoc.exists()) {
        throw new Error('La recomendación no existe.');
      }

      const recData = recDoc.data();
      const currentReviewCount = Number(recData.reviewCount ?? 0);
      const currentRatingSum = Number(recData.ratingSum ?? 0);

      const reviewDoc = await transaction.get(reviewRef);

      if (reviewDoc.exists()) {
        // Edit existing review
        const oldRating = Number(reviewDoc.data()?.rating ?? rating);
        const ratingDiff = Number(rating) - oldRating;
        const newRatingSum = currentRatingSum + ratingDiff;

        transaction.update(reviewRef, {
          rating: Number(rating),
          comment: comment.trim(),
          authorName: authorName.trim(),
        });

        transaction.update(recRef, {
          ratingSum: Math.max(0, newRatingSum),
        });
      } else {
        // Create new review
        const newReviewCount = currentReviewCount + 1;
        const newRatingSum = currentRatingSum + Number(rating);

        transaction.set(reviewRef, {
          recommendationId,
          authorId,
          authorName: authorName.trim(),
          rating: Number(rating),
          comment: comment.trim(),
          createdAt: serverTimestamp(),
        });

        transaction.update(recRef, {
          reviewCount: newReviewCount,
          ratingSum: newRatingSum,
        });
      }
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.WRITE,
      `recommendations/${recommendationId}/reviews/${authorId}`
    );
  }
}

// Delete review in a single transaction with recommendation counters
export async function deleteReviewTransaction(
  recommendationId: string,
  authorId: string
): Promise<void> {
  const recRef = doc(db, 'recommendations', recommendationId);
  const reviewRef = doc(db, 'recommendations', recommendationId, 'reviews', authorId);

  try {
    await runTransaction(db, async (transaction) => {
      const recDoc = await transaction.get(recRef);
      const reviewDoc = await transaction.get(reviewRef);

      if (!reviewDoc.exists()) {
        return; // Already deleted
      }

      const recData = recDoc.exists() ? recDoc.data() : null;
      const currentReviewCount = Number(recData?.reviewCount ?? 1);
      const currentRatingSum = Number(recData?.ratingSum ?? 0);
      const reviewRating = Number(reviewDoc.data()?.rating ?? 0);

      const newReviewCount = Math.max(0, currentReviewCount - 1);
      const newRatingSum = Math.max(0, currentRatingSum - reviewRating);

      transaction.delete(reviewRef);

      if (recDoc.exists()) {
        transaction.update(recRef, {
          reviewCount: newReviewCount,
          ratingSum: newRatingSum,
        });
      }
    });
  } catch (error) {
    handleFirestoreError(
      error,
      OperationType.DELETE,
      `recommendations/${recommendationId}/reviews/${authorId}`
    );
  }
}

// Create new recommendation
export async function createRecommendation(data: {
  name: string;
  category: CategoryType;
  zone: string;
  price: PriceLevel;
  rating: RatingLevel;
  whatToOrder: string;
  comment: string;
  authorId: string;
  authorName: string;
}): Promise<string> {
  const colRef = collection(db, 'recommendations');
  try {
    const docRef = await addDoc(colRef, {
      name: data.name.trim(),
      category: data.category,
      zone: data.zone.trim(),
      price: Number(data.price),
      rating: Number(data.rating),
      whatToOrder: data.whatToOrder.trim(),
      comment: data.comment.trim(),
      authorId: data.authorId,
      authorName: data.authorName.trim(),
      status: 'publicada',
      reviewCount: 0,
      ratingSum: 0,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'recommendations');
  }
}

// Update existing recommendation
export async function updateRecommendation(
  id: string,
  data: {
    name: string;
    category: CategoryType;
    zone: string;
    price: PriceLevel;
    rating: RatingLevel;
    whatToOrder: string;
    comment: string;
    authorName: string;
  }
): Promise<void> {
  const docRef = doc(db, 'recommendations', id);
  try {
    await updateDoc(docRef, {
      name: data.name.trim(),
      category: data.category,
      zone: data.zone.trim(),
      price: Number(data.price),
      rating: Number(data.rating),
      whatToOrder: data.whatToOrder.trim(),
      comment: data.comment.trim(),
      authorName: data.authorName.trim(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `recommendations/${id}`);
  }
}

// Delete recommendation
export async function deleteRecommendation(id: string): Promise<void> {
  const docRef = doc(db, 'recommendations', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `recommendations/${id}`);
  }
}

// Report recommendation (changes status to reportada)
export async function reportRecommendation(id: string): Promise<void> {
  const docRef = doc(db, 'recommendations', id);
  try {
    await updateDoc(docRef, {
      status: 'reportada',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `recommendations/${id}`);
  }
}

// Admin moderation (changes status to oculta or publicada)
export async function moderateRecommendation(
  id: string,
  newStatus: 'publicada' | 'oculta'
): Promise<void> {
  const docRef = doc(db, 'recommendations', id);
  try {
    await updateDoc(docRef, {
      status: newStatus,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `recommendations/${id}`);
  }
}

// Subscribe to reported and hidden recommendations for Moderacion screen
export function subscribeToModeration(
  onSuccess: (items: Recommendation[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, 'recommendations');
  const q = query(colRef, where('status', 'in', ['reportada', 'oculta']));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Recommendation[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || '',
          category: data.category || 'comer',
          zone: data.zone || '',
          price: data.price || 1,
          rating: data.rating || 5,
          whatToOrder: data.whatToOrder || '',
          comment: data.comment || '',
          authorId: data.authorId || '',
          authorName: data.authorName || '',
          status: data.status || 'reportada',
          reviewCount: data.reviewCount ?? 0,
          ratingSum: data.ratingSum ?? 0,
          createdAt: data.createdAt,
        });
      });
      items.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      onSuccess(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'recommendations');
    }
  );
}


// Seed 8 example recommendations for admin
export async function seedExampleRecommendations(
  authorId: string,
  authorName: string
): Promise<void> {
  const examples: Array<{
    name: string;
    category: CategoryType;
    zone: string;
    price: PriceLevel;
    rating: RatingLevel;
    whatToOrder: string;
    comment: string;
  }> = [
    {
      name: 'Café Las Acacias',
      category: 'cafe',
      zone: 'Centro',
      price: 1,
      rating: 5,
      whatToOrder: 'Café filtrado y medialuna de manteca',
      comment: 'Un rincón tranquilo con excelente café de especialidad y música suave.',
    },
    {
      name: 'Trattoria La Pergola',
      category: 'comer',
      zone: 'Zona Norte',
      price: 2,
      rating: 5,
      whatToOrder: 'Ravioles de espinaca con salsa cuatro quesos',
      comment: 'Pastas caseras impecables, porciones generosas y atención muy atenta.',
    },
    {
      name: 'Mirador del Parque',
      category: 'paseo',
      zone: 'Zona Sur',
      price: 1,
      rating: 4,
      whatToOrder: 'Caminata al atardecer por el sendero alto',
      comment: 'Vista panorámica hermosa para despejarse y caminar al aire libre.',
    },
    {
      name: 'Bar Cantina Central',
      category: 'salir',
      zone: 'Centro',
      price: 2,
      rating: 4,
      whatToOrder: 'Vermut tirado con picada de quesos y aceitunas',
      comment: 'Buen ambiente para arrancar el fin de semana con amigos.',
    },
    {
      name: 'Bistró del Río',
      category: 'comer',
      zone: 'Zona Este',
      price: 3,
      rating: 5,
      whatToOrder: 'Pesca del día con risotto de limón',
      comment: 'Platos cuidados y muy ricos. Ideal para una ocasión especial.',
    },
    {
      name: 'Tostaduría San Telmo',
      category: 'cafe',
      zone: 'Zona Oeste',
      price: 2,
      rating: 4,
      whatToOrder: 'Flat white con tostada de masa madre y palta',
      comment: 'Gran variedad de granos y espacio cómodo para leer un rato.',
    },
    {
      name: 'Jardín Botánico Municipal',
      category: 'paseo',
      zone: 'Zona Norte',
      price: 1,
      rating: 5,
      whatToOrder: 'Recorrer el invernadero histórico y senderos arbolados',
      comment: 'Paz total en medio de la ciudad, gratuito y muy bien mantenido.',
    },
    {
      name: 'Club de Jazz 440',
      category: 'salir',
      zone: 'Zona Sur',
      price: 3,
      rating: 5,
      whatToOrder: 'Cóctel de autor de la casa con música en vivo',
      comment: 'Sonido impecable, tragos clásicos bien preparados y atmósfera cálida.',
    },
  ];

  for (const item of examples) {
    await createRecommendation({
      ...item,
      authorId,
      authorName: authorName || 'Administradora',
    });
  }
}

// Subscribe to user's saved places (Quiero ir)
export function subscribeToSavedPlaces(
  userId: string,
  onSuccess: (savedList: SavedPlace[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, 'users', userId, 'saved');
  const q = query(colRef, orderBy('savedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavedPlace[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          recommendationId: docSnap.id,
          name: data.name || '',
          category: data.category || 'comer',
          zone: data.zone || '',
          price: data.price || 1,
          savedAt: data.savedAt,
        });
      });
      onSuccess(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/saved`);
    }
  );
}

// Save a place to Quiero ir
export async function savePlace(
  userId: string,
  place: {
    id: string;
    name: string;
    category: CategoryType;
    zone: string;
    price: PriceLevel;
  }
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'saved', place.id);
  try {
    await setDoc(docRef, {
      recommendationId: place.id,
      name: place.name.trim(),
      category: place.category,
      zone: place.zone.trim(),
      price: Number(place.price),
      savedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${userId}/saved/${place.id}`);
  }
}

// Unsave a place from Quiero ir
export async function unsavePlace(userId: string, recommendationId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'saved', recommendationId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/saved/${recommendationId}`);
  }
}

// Subscribe to lists where the user is a member
export function subscribeToUserLists(
  userId: string,
  onSuccess: (lists: GroupList[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, 'lists');
  const q = query(colRef, where('memberIds', 'array-contains', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: GroupList[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.title || '',
          ownerId: data.ownerId || '',
          memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
          createdAt: data.createdAt,
        });
      });
      // Sort in memory by createdAt descending
      items.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      onSuccess(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, 'lists');
    }
  );
}

// Create new group list
export async function createGroupList(title: string, ownerId: string): Promise<string> {
  const colRef = collection(db, 'lists');
  try {
    const docRef = await addDoc(colRef, {
      title: title.trim(),
      ownerId,
      memberIds: [ownerId],
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'lists');
  }
}

// Join list via shared link using arrayUnion without reading before
export async function joinListViaShare(listId: string, userId: string): Promise<void> {
  const docRef = doc(db, 'lists', listId);
  try {
    await updateDoc(docRef, {
      memberIds: arrayUnion(userId),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `lists/${listId}`);
  }
}

// Delete group list
export async function deleteGroupList(listId: string): Promise<void> {
  const docRef = doc(db, 'lists', listId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `lists/${listId}`);
  }
}

// Subscribe to a single group list
export function subscribeToGroupList(
  listId: string,
  onSuccess: (list: GroupList | null) => void,
  onError?: (error: Error) => void
) {
  const docRef = doc(db, 'lists', listId);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (!docSnap.exists()) {
        onSuccess(null);
        return;
      }
      const data = docSnap.data();
      onSuccess({
        id: docSnap.id,
        title: data.title || '',
        ownerId: data.ownerId || '',
        memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
        createdAt: data.createdAt,
      });
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, `lists/${listId}`);
    }
  );
}

// Subscribe to options proposed for a list
export function subscribeToListOptions(
  listId: string,
  onSuccess: (options: ListOption[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, 'lists', listId, 'options');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: ListOption[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || '',
          category: data.category || 'comer',
          zone: data.zone || '',
          price: data.price || 1,
          addedBy: data.addedBy || '',
          createdAt: data.createdAt,
        });
      });
      onSuccess(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, `lists/${listId}/options`);
    }
  );
}

// Add an option to a list
export async function addOptionToList(
  listId: string,
  place: {
    id: string;
    name: string;
    category: CategoryType;
    zone: string;
    price: PriceLevel;
  },
  userId: string
): Promise<void> {
  const docRef = doc(db, 'lists', listId, 'options', place.id);
  try {
    await setDoc(docRef, {
      name: place.name.trim(),
      category: place.category,
      zone: place.zone.trim(),
      price: Number(place.price),
      addedBy: userId,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `lists/${listId}/options/${place.id}`);
  }
}

// Delete an option from a list
export async function deleteOptionFromList(listId: string, optionId: string): Promise<void> {
  const docRef = doc(db, 'lists', listId, 'options', optionId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `lists/${listId}/options/${optionId}`);
  }
}

// Subscribe to votes for a list
export function subscribeToListVotes(
  listId: string,
  onSuccess: (votes: ListVote[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, 'lists', listId, 'votes');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: ListVote[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          userId: docSnap.id,
          optionId: data.optionId || '',
        });
      });
      onSuccess(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.LIST, `lists/${listId}/votes`);
    }
  );
}

// Cast or toggle vote
export async function voteForOption(listId: string, userId: string, optionId: string): Promise<void> {
  const docRef = doc(db, 'lists', listId, 'votes', userId);
  try {
    await setDoc(docRef, {
      optionId,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `lists/${listId}/votes/${userId}`);
  }
}

// Remove vote
export async function removeVote(listId: string, userId: string): Promise<void> {
  const docRef = doc(db, 'lists', listId, 'votes', userId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `lists/${listId}/votes/${userId}`);
  }
}


