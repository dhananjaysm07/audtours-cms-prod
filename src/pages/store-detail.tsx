import React, { useEffect } from 'react';
import { useParams } from 'react-router';
import { Folder } from 'lucide-react'; // Assuming you're using Lucide React icons
import { toast } from 'sonner';
import { useStorefrontStore } from '@/store/useStoreFrontStore';
import { Node } from '@/types';
import { cn } from '@/lib/utils';

const StorePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentStore, fetchStore, isLoading, error } = useStorefrontStore();

  useEffect(() => {
    if (id) {
      fetchStore(parseInt(id));
    }
  }, [id, fetchStore]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    toast.error(error);
    return <div>Error: {error}</div>;
  }

  if (!currentStore) {
    return <div>Store not found</div>;
  }

  const handleNodeDoubleClick = (nodeId: number) => {
    window.open(`/explorer?parentNodeId=${nodeId}`, '_blank');
  };

  const getFolderItemIcon = (node: Node) => {
    const iconStyle = {
      opacity: node.isActive ? 1 : 0.6,
    };

    return (
      <Folder
        size={56}
        className="text-blue-500 fill-blue-500"
        strokeWidth={1.5}
        style={iconStyle}
      />
    );
  };

  return (
    <div className="p-4 bg-white rounded-lg gap-4 flex-1 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">{currentStore.heading}</h1>
      <p className="text-gray-700 mb-6">{currentStore.description}</p>
      <div className="flex-1 flex flex-wrap gap-6 p-2 overflow-y-auto scroll-smooth h-full justify-start items-start rounded-lg">
        {currentStore.nodes.map((nod) => (
          <div
            onDoubleClick={() => handleNodeDoubleClick(nod.id)}
            className={cn(
              'h-28 aspect-square flex flex-col items-center focus-visible:outline hover:bg-blue-50 justify-center shrink-0 rounded-lg'
            )}
            tabIndex={0}
          >
            {getFolderItemIcon(nod)}
            <div className="flex justify-center">
              <span className="text-sm truncate max-w-24">{nod.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StorePage;
