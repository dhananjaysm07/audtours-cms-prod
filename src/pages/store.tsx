import { StoreGrid } from '@/components/store-grid';
import { StoreDialog } from '@/components/store-dialog';
import { useStorefrontStore } from '@/store/useStoreFrontStore';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Store } from '@/types';
import { CreateStorePayload, UpdateStorePayload } from '@/lib/api/store';

function StorePage() {
  const {
    stores,
    isLoading,
    fetchStores,
    toggleStoreActivation,
    createStore,
    updateStore,
    error_status,
  } = useStorefrontStore();

  // Use useRef to prevent dialog from closing due to state changes
  const dialogOpenRef = useRef(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  // Flag to control when we should handle status changes
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch stores on component mount - only once
  useEffect(() => {
    if (fetchStores) {
      fetchStores();
    }
  }, [fetchStores]);

  // Handle edit button click with useCallback to prevent unnecessary re-renders
  const handleEdit = useCallback(
    (id: number) => {
      const store = stores?.find(s => s.id === id);
      if (store) {
        setSelectedStore(store);
        setDialogOpen(true);
        dialogOpenRef.current = true;
      }
    },
    [stores],
  );

  // Handle create new button click with useCallback
  const handleCreateNew = useCallback(() => {
    setSelectedStore(null);
    setDialogOpen(true);
    dialogOpenRef.current = true;
  }, []);

  // Handle toggle activation with useCallback
  const handleToggleActivation = useCallback(
    async (id: number, isActive: boolean) => {
      if (toggleStoreActivation) {
        await toggleStoreActivation(id, !isActive);
      }
    },
    [toggleStoreActivation],
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (data: CreateStorePayload | UpdateStorePayload) => {
      setIsSubmitting(true);
      try {
        if (selectedStore && updateStore) {
          await updateStore(selectedStore.id, data as UpdateStorePayload);
        } else if (createStore) {
          await createStore(data as CreateStorePayload);
        }
      } catch (error) {
        console.error('Error submitting store:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedStore, updateStore, createStore],
  );

  // Close dialog only when submission is successful and we're not in the middle of a state change
  useEffect(() => {
    // Only close if a submission just completed successfully
    if (
      dialogOpenRef.current &&
      !isLoading &&
      error_status === null &&
      isSubmitting === false
    ) {
      // Use setTimeout to avoid state update conflicts
      const timer = setTimeout(() => {
        setDialogOpen(false);
        setSelectedStore(null);
        dialogOpenRef.current = false;
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [error_status, isLoading, isSubmitting]);

  // Handle dialog open/close without interfering with other state changes
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (isLoading && !open) return; // Don't allow closing during loading

      // If opening the dialog, update the ref
      if (open) {
        dialogOpenRef.current = true;
      }

      setDialogOpen(open);

      // If closing the dialog, clear the selected store
      if (!open) {
        const timer = setTimeout(() => {
          setSelectedStore(null);
          dialogOpenRef.current = false;
        }, 100);

        return () => clearTimeout(timer);
      }
    },
    [isLoading],
  );

  return (
    <div className="flex flex-col p-4 pt-0 rounded-lg gap-4 flex-1">
      <StoreGrid
        stores={stores || []}
        onEdit={handleEdit}
        onToggleActivation={handleToggleActivation}
        onCreateNew={handleCreateNew}
        isLoading={isLoading || false}
      />

      {/* Always render the dialog to maintain state - control visibility with 'open' prop */}
      <StoreDialog
        open={dialogOpen}
        onOpenChange={handleOpenChange}
        onSubmit={handleSubmit}
        initialData={selectedStore || undefined}
        mode={selectedStore ? 'edit' : 'create'}
        isLoading={isLoading || false}
      />
    </div>
  );
}

export default StorePage;
