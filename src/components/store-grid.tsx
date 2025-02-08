import { Store } from "@/types";
import { Plus } from "lucide-react";
import { StoreCard } from "./store-card";
import LoadingSpinner from "./spinner";
import { Button } from "./ui/button";

interface StoreGridProps {
  stores: Store[];
  onEdit: (id: number) => void;
  onToggleActivation: (id: number, isActive: boolean) => void;
  onCreateNew: () => void;
  isLoading: boolean;
}

export function StoreGrid({
  stores,
  onEdit,
  onToggleActivation,
  onCreateNew,
  isLoading,
}: StoreGridProps) {
  return (
    <div className="p-6 pt-2 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-5 mb-6">
        <div className="flex justify-between items-center">
          <div>
            {/* <h1 className="text-3xl font-bold text-gray-900 mb-1.5">Stores</h1> */}
            <p className="text-gray-600 text-sm">
              Manage your storefronts and their settings
            </p>
          </div>
          <Button onClick={onCreateNew} size="sm" className="gap-1">
            + Create Store
          </Button>
        </div>
        {/* <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px]">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search stores..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div> */}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
        {isLoading && stores.length == 0 ? (
          <div className="grid h-full w-full place-items-center pb-16">
            <LoadingSpinner size="medium" />
          </div>
        ) : (
          <>
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                onEdit={onEdit}
                onToggleActivation={onToggleActivation}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
