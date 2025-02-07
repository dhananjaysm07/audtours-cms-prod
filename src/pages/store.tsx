import { StoreGrid } from "@/components/store-grid";
import { StoreDialog } from "@/components/store-dialog";
import { useStorefrontStore } from "@/store/useStoreFrontStore";
import { useEffect, useState } from "react";
import { Store } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingSpinner from "@/components/spinner";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleEdit = (id: number) => {
    const store = stores.find((s) => s.id === id);
    if (store) {
      setSelectedStore(store);
      setDialogOpen(true);
    }
  };

  const handleCreateNew = () => {
    console.log("Create new function called..", dialogOpen);
    setSelectedStore(null);
    setDialogOpen(true);
  };

  const handleToggleActivation = async (id: number, isActive: boolean) => {
    await toggleStoreActivation(id, !isActive);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedStore) {
        await updateStore(selectedStore.id, data);
      } else {
        await createStore(data);
      }
    } catch (error) {
      console.error("Error submitting store:", error);
    }
  };

  useEffect(() => {
    if (dialogOpen && error_status == null && !isLoading) {
      setDialogOpen(false);
      setSelectedStore(null);
    }
  }, [error_status, isLoading]);

  return (
    <div className="flex flex-col p-4 rounded-lg gap-4 flex-1">
      <StoreGrid
        stores={stores}
        onEdit={handleEdit}
        onToggleActivation={handleToggleActivation}
        onCreateNew={handleCreateNew}
        isLoading={isLoading}
      />
      <StoreDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        initialData={selectedStore || undefined}
        mode={selectedStore ? "edit" : "create"}
      />
    </div>
  );
}

export default StorePage;
