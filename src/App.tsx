import React, { useEffect, useMemo, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { BottomNav, type TabType } from './components/BottomNav';
import { ExplorarView } from './components/ExplorarView';
import { QuieroIrView } from './components/QuieroIrView';
import { ListasView } from './components/ListasView';
import { ListDetailView } from './components/ListDetailView';
import { ModeracionView } from './components/ModeracionView';
import { RecommendationDetail } from './components/RecommendationDetail';
import { RecommendationFormModal } from './components/RecommendationFormModal';
import { ProfileView } from './components/ProfileView';
import {
  subscribeToFeed,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
  subscribeToSavedPlaces,
  savePlace,
  unsavePlace,
  subscribeToUserLists,
  joinListViaShare,
} from './services/recommendations';
import type {
  Recommendation,
  SavedPlace,
  GroupList,
  CategoryType,
  PriceLevel,
  RatingLevel,
} from './types';

function MainApp() {
  const { user, signInWithGoogle } = useAuth();

  const [currentTab, setCurrentTab] = useState<TabType>('explorar');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Saved places (Quiero ir)
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isSavedLoading, setIsSavedLoading] = useState<boolean>(false);

  // Group Lists
  const [userLists, setUserLists] = useState<GroupList[]>([]);
  const [isListsLoading, setIsListsLoading] = useState<boolean>(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Selected item for Recommendation Detail view
  const [selectedItem, setSelectedItem] = useState<Recommendation | null>(null);

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [itemToEdit, setItemToEdit] = useState<Recommendation | null>(null);

  // Shared list invitation state
  const [pendingSharedListId, setPendingSharedListId] = useState<string | null>(null);

  // Moderacion view state (admin only)
  const [isModeracionOpen, setIsModeracionOpen] = useState<boolean>(false);

  // Check URL query param ?lista=ID on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const listaParam = params.get('lista');
    if (listaParam) {
      setPendingSharedListId(listaParam);
    }
  }, []);

  // When user is authenticated and there's a pending shared list, join automatically!
  useEffect(() => {
    if (!pendingSharedListId) return;

    if (user) {
      joinListViaShare(pendingSharedListId, user.uid)
        .then(() => {
          setCurrentTab('listas');
          setSelectedListId(pendingSharedListId);
          setPendingSharedListId(null);
        })
        .catch(() => {
          // If already member or update failed, still open list
          setCurrentTab('listas');
          setSelectedListId(pendingSharedListId);
          setPendingSharedListId(null);
        });
    } else {
      // Prompt user to enter with Google
      setCurrentTab('listas');
    }
  }, [user, pendingSharedListId]);

  // Subscribe to public and reported recommendations
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToFeed(
      (data) => {
        setRecommendations(data);
        setIsLoading(false);

        // Keep selectedItem in sync if it gets updated
        setSelectedItem((prev) => {
          if (!prev) return null;
          const fresh = data.find((r) => r.id === prev.id);
          return fresh || null;
        });
      },
      (error) => {
        console.error('Error suscribiendo al feed:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to saved places for current user
  useEffect(() => {
    if (!user) {
      setSavedPlaces([]);
      setIsSavedLoading(false);
      return;
    }

    setIsSavedLoading(true);
    const unsubscribe = subscribeToSavedPlaces(
      user.uid,
      (list) => {
        setSavedPlaces(list);
        setIsSavedLoading(false);
      },
      (error) => {
        console.error('Error suscribiendo a Quiero ir:', error);
        setIsSavedLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Subscribe to group lists for current user
  useEffect(() => {
    if (!user) {
      setUserLists([]);
      setIsListsLoading(false);
      return;
    }

    setIsListsLoading(true);
    const unsubscribe = subscribeToUserLists(
      user.uid,
      (lists) => {
        setUserLists(lists);
        setIsListsLoading(false);
      },
      (error) => {
        console.error('Error suscribiendo a listas:', error);
        setIsListsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Set of saved recommendation IDs
  const savedIds = useMemo(() => {
    return new Set(savedPlaces.map((sp) => sp.recommendationId));
  }, [savedPlaces]);

  // Toggle save / unsave
  const handleToggleSave = async (place: Recommendation) => {
    if (!user) {
      signInWithGoogle();
      return;
    }

    const isCurrentlySaved = savedIds.has(place.id);
    if (isCurrentlySaved) {
      await unsavePlace(user.uid, place.id);
    } else {
      await savePlace(user.uid, {
        id: place.id,
        name: place.name,
        category: place.category,
        zone: place.zone,
        price: place.price,
      });
    }
  };

  const handleOpenNew = () => {
    setItemToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: Recommendation) => {
    setItemToEdit(item);
    setIsFormOpen(true);
  };

  const handleSaveRecommendation = async (data: {
    name: string;
    category: CategoryType;
    zone: string;
    price: PriceLevel;
    rating: RatingLevel;
    whatToOrder: string;
    comment: string;
    authorName: string;
  }) => {
    if (itemToEdit) {
      await updateRecommendation(itemToEdit.id, data);
    } else {
      if (!user) return;
      await createRecommendation({
        ...data,
        authorId: user.uid,
      });
    }
    setIsFormOpen(false);
    setItemToEdit(null);
  };

  const handleDeleteRecommendation = async (item: Recommendation) => {
    await deleteRecommendation(item.id);
    setSelectedItem(null);
  };

  const handleSelectTab = (tab: TabType) => {
    setCurrentTab(tab);
    setSelectedItem(null);
    setSelectedListId(null);
    setIsModeracionOpen(false);
  };

  const isViewingSubscreen = Boolean(selectedItem || selectedListId || isModeracionOpen);

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col items-center">
      <div className="w-full max-w-md min-h-screen flex flex-col relative bg-[#F7F7F5] shadow-xs">
        {/* Header (hidden if viewing subscreen to give full space to detail top bar) */}
        {!isViewingSubscreen && (
          <Header onProfileClick={() => handleSelectTab('perfil')} />
        )}

        {/* Content area */}
        <main className="flex-1 pb-16">
          {selectedItem ? (
            <RecommendationDetail
              item={selectedItem}
              isSaved={savedIds.has(selectedItem.id)}
              onToggleSave={handleToggleSave}
              onBack={() => setSelectedItem(null)}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteRecommendation}
            />
          ) : selectedListId ? (
            <ListDetailView
              listId={selectedListId}
              onBack={() => setSelectedListId(null)}
              allRecommendations={recommendations}
              onOpenRecommendation={(item) => setSelectedItem(item)}
            />
          ) : isModeracionOpen ? (
            <ModeracionView
              onBack={() => setIsModeracionOpen(false)}
              onSelectItem={(item) => setSelectedItem(item)}
            />
          ) : currentTab === 'explorar' ? (
            <ExplorarView
              recommendations={recommendations}
              isLoading={isLoading}
              savedIds={savedIds}
              onSelectItem={(item) => setSelectedItem(item)}
              onToggleSave={handleToggleSave}
              onOpenNewRecommendation={handleOpenNew}
            />
          ) : currentTab === 'quiero_ir' ? (
            <QuieroIrView
              savedPlaces={savedPlaces}
              allRecommendations={recommendations}
              isLoading={isSavedLoading}
              onSelectItem={(item) => setSelectedItem(item)}
              onToggleSave={handleToggleSave}
            />
          ) : currentTab === 'listas' ? (
            <ListasView
              lists={userLists}
              isLoading={isListsLoading}
              onSelectList={(listId) => setSelectedListId(listId)}
            />
          ) : (
            <ProfileView
              allRecommendations={recommendations}
              savedIds={savedIds}
              onSelectItem={(item) => setSelectedItem(item)}
              onToggleSave={handleToggleSave}
              onOpenModeracion={() => setIsModeracionOpen(true)}
            />
          )}
        </main>

        {/* Bottom Nav */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
        />

        {/* Create / Edit Recommendation Form Modal */}
        <RecommendationFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setItemToEdit(null);
          }}
          onSave={handleSaveRecommendation}
          initialData={itemToEdit}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
